# Progress

## Session 2 — Fly.io Deployment Setup (March 14, 2026)
- Added Fly.io deployment infrastructure (Dockerfile, fly.toml, .dockerignore)
- Made DB_PATH and GENERATED_DIR configurable via env vars for production
- Configured Next.js standalone output for Docker builds
- Created start.sh entrypoint that symlinks volume-stored images into public/
- Created sync-to-fly.sh for incremental image + DB push to remote via flyctl sftp
- Added pnpm scripts: sync:images, sync:db, sync:all, fly:deploy
- Updated ARCH.md with deployment section

## Session 1 — MVP Implementation (March 13, 2026)
- Phase 1: Scaffolded Next.js 14 project (TypeScript strict, Tailwind v4, Biome, Vitest)
- Phase 1b: RTL Hebrew layout with Heebo font, dark newspaper theme
- Phase 2: SQLite layer (better-sqlite3, schema, query functions, 9 passing tests)
- Phase 3: Multi-provider AI layer (OpenAI/Google/BFL, text + image providers, registry, prompts, 18 tests)
- Phase 4: Google News RSS fetcher with XML parsing and deduplication (5 tests)
- Phase 5: API routes (/api/generate, /api/news, /api/cron, /api/health) + node-cron scheduler
- Phase 6: Frontend — feed page with NewsCard grid, admin page with model selectors
- Phase 7: Logger utility, error handling, loading states
- 32 total tests passing, typecheck clean, build succeeds

## Session 0 — Project Setup (March 13, 2026)
- Initialized git repo
- Moved chat transcripts to `docs/reference/`
- Created `.gitignore` for Next.js/TypeScript project
- Created `SPEC.md` with detailed MVP spec (news ingestion, prompt pipeline, image gen, frontend, data model)
- Created `CLAUDE.md` developer guide
- Created `ARCH.md` with planned architecture and file tree
- Created `TASKS.md` with phased backlog
- Created `.context/` memory bank
- Created `.claude/` config (hooks, commands, skills)
- Created `.cursor/rules/standards.mdc`
