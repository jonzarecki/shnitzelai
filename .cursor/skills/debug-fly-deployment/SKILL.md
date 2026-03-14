---
name: debug-fly-deployment
description: Debug and troubleshoot the shnitzelai Fly.io deployment, and verify sync results. Use when the remote app is crashing, health checks fail, images are missing, sync fails, deploy errors occur, the user asks to verify content on remote, or the user mentions Fly, production, or remote issues.
---

# Debug Fly.io Deployment

## Deployment Overview

- **App**: `shnitzelai` on Fly.io (region `iad`)
- **URL**: https://shnitzelai.fly.dev/
- **Volume**: `/data` (1GB) holds `shnitzel.db` and `generated/*.png`
- **Health check**: `GET /api/news` every 30s
- **Auto-stop**: machines stop when idle, start on incoming request
- **Container user**: `nextjs` (uid 1001) — permission errors often trace here
- **Start script**: `tooling/scripts/start.sh` — symlinks `/data/generated` into `public/generated`, then runs `node server.js`

## Triage Checklist

Run these in order to locate the problem:

### 1. App status and machine state

```bash
flyctl status -a shnitzelai
```

Key things to look for:
- **STATE**: `started`, `stopped`, `replacing`, `destroyed`
- **CHECKS**: `passing`, `warning`, `critical`
- **VERSION**: did the latest deploy roll out?

If stopped with auto-start enabled, a request to the URL should wake it.

### 2. Recent logs

```bash
flyctl logs -a shnitzelai --no-tail | tail -50
```

Common error patterns:
- `Permission denied` — file/dir ownership issue, check `--chown` in Dockerfile
- `Cannot find module` / native binding error — `better-sqlite3` not compiled, check `pnpm.onlyBuiltDependencies` in `package.json` and build tools in Dockerfile deps stage
- `SQLITE_CANTOPEN` — DB file missing or path wrong, verify `DATABASE_PATH` env
- `max restart count` — container crash-looping, read earlier log lines for root cause

### 3. Verify volume contents

```bash
flyctl ssh console -a shnitzelai -C "ls -la /data/"
flyctl ssh console -a shnitzelai -C "ls -la /data/generated/ | head -20"
flyctl ssh console -a shnitzelai -C "ls -la /app/public/generated"
```

Check that:
- `/data/shnitzel.db` exists and has nonzero size
- `/data/generated/` has `.png` files
- `/app/public/generated` is a symlink pointing to `/data/generated`

### 4. Test endpoints

```bash
curl -s --max-time 15 https://shnitzelai.fly.dev/api/news | head -200
curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://shnitzelai.fly.dev/api/health
```

If first request times out, the machine is likely waking from auto-stop — wait 10s and retry.

## Common Issues

### Deploy fails: TypeScript errors

The build runs `next build` which typechecks. Pre-existing type errors in code not touched by your change will still fail the remote build. Fix or suppress them before deploying.

### Deploy fails: native module not found

`better-sqlite3` needs native compilation. Ensure:
1. `package.json` has `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3"] }`
2. Dockerfile deps stage installs `python3 make g++`

### Container crash-loops: Permission denied on symlink

The `start.sh` script creates `ln -sfn /data/generated /app/public/generated`. If `/app/public` is not owned by `nextjs`, this fails. Ensure the Dockerfile has:
```
COPY --from=build --chown=nextjs:nodejs /app/public ./public
```

### Sync fails: "remote file already exists"

`flyctl ssh sftp put` does not overwrite. Delete the remote file first:
```bash
flyctl ssh console -a shnitzelai -q -C "rm -f /data/shnitzel.db"
```
Then retry the put.

### API returns empty after sync

The Node.js process caches the DB connection. Restart the machine:
```bash
flyctl machines list -a shnitzelai
flyctl machines restart <MACHINE_ID> -a shnitzelai
```

### Images 404 on remote

Verify the symlink is intact:
```bash
flyctl ssh console -a shnitzelai -C "readlink /app/public/generated"
```
Should output `/data/generated`. If broken, restart the machine (start.sh recreates it).

## Verify Sync

After running `pnpm sync:all` (or `sync:images` / `sync:db`), verify that remote content matches local.

### Quick verification

```bash
# 1. Compare image counts
local_count=$(find public/generated -name '*.png' | wc -l | tr -d ' ')
remote_count=$(flyctl ssh console -a shnitzelai -q -C "ls /data/generated/*.png 2>/dev/null | wc -l" | tr -d '[:space:]')
echo "Local: $local_count  Remote: $remote_count"

# 2. Compare DB record counts
local_rows=$(sqlite3 shnitzel.db "SELECT COUNT(*) FROM generations;")
remote_rows=$(flyctl ssh console -a shnitzelai -q -C "sqlite3 /data/shnitzel.db 'SELECT COUNT(*) FROM generations;'" | tr -d '[:space:]')
echo "Local rows: $local_rows  Remote rows: $remote_rows"
```

Counts should match. If remote DB has fewer rows, re-run `pnpm sync:db` then restart the machine.

### Full content verification

Check that the API actually returns items and images are accessible:

```bash
# 3. Fetch item count and image paths from API
curl -s --max-time 15 https://shnitzelai.fly.dev/api/news \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data['items']
print(f'API returns {len(items)} items (total: {data[\"pagination\"][\"total\"]})')
for i in items:
    print(f'  {i[\"image_path\"]}  {i[\"schnitzel_headline\"][:60]}')
"

# 4. Spot-check that first image actually loads
first_path=$(curl -s --max-time 15 https://shnitzelai.fly.dev/api/news \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['items'][0]['image_path'])")
curl -s -o /dev/null -w "Image %{url}: HTTP %{http_code}, %{size_download} bytes\n" \
  --max-time 10 "https://shnitzelai.fly.dev${first_path}"
```

### What to check if counts diverge

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Remote images < local | `sftp put` skipped files (already exist) | Manually push missing images or delete remote + resync |
| Remote DB rows = 0 | DB wasn't synced or machine has stale cached connection | `pnpm sync:db` then restart machine |
| API returns items but images 404 | Symlink broken or images not on volume | Check `readlink /app/public/generated` and `/data/generated/` contents |
| API returns 0 items, DB file exists | Machine using in-memory cached empty DB from before sync | Restart machine: `flyctl machines restart MACHINE_ID -a shnitzelai` |

## Useful Commands Reference

| Task | Command |
|------|---------|
| App status | `flyctl status -a shnitzelai` |
| Stream logs | `flyctl logs -a shnitzelai` |
| Recent logs | `flyctl logs -a shnitzelai --no-tail \| tail -50` |
| SSH shell | `flyctl ssh console -a shnitzelai` |
| Run remote command | `flyctl ssh console -a shnitzelai -C "CMD"` |
| List remote files | `flyctl ssh sftp find /data -a shnitzelai` |
| Push file | `flyctl ssh sftp put LOCAL REMOTE -a shnitzelai` |
| Get file | `flyctl ssh sftp get REMOTE LOCAL -a shnitzelai` |
| List machines | `flyctl machines list -a shnitzelai` |
| Restart machine | `flyctl machines restart MACHINE_ID -a shnitzelai` |
| Redeploy | `flyctl deploy --remote-only -a shnitzelai` |
| Sync images | `pnpm sync:images` |
| Sync DB | `pnpm sync:db` |
| Sync all | `pnpm sync:all` |
