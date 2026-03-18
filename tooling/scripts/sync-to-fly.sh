#!/bin/sh
set -e

APP_NAME="shnitzelai"
LOCAL_GENERATED="public/generated"
REMOTE_GENERATED="/data/generated"
LOCAL_DB="shnitzel.db"
REMOTE_DB="/data/shnitzel.db"

usage() {
  echo "Usage: $0 <images|db|all>"
  echo ""
  echo "Commands:"
  echo "  images   Push local generated images to remote (incremental)"
  echo "  db       Push local SQLite DB to remote"
  echo "  all      Push both images and DB"
  exit 1
}

sync_images() {
  if [ ! -d "$LOCAL_GENERATED" ]; then
    echo "No local generated images at $LOCAL_GENERATED"
    exit 1
  fi

  local_count=$(find "$LOCAL_GENERATED" -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$local_count" = "0" ]; then
    echo "No images to sync."
    return
  fi

  echo "Fetching remote file list..."
  remote_files=$(flyctl ssh sftp find "$REMOTE_GENERATED" -a "$APP_NAME" -q 2>/dev/null || echo "")

  tmp_dir=$(mktemp -d)
  trap "rm -rf $tmp_dir" EXIT

  to_push=0
  for local_file in "$LOCAL_GENERATED"/*.png; do
    filename=$(basename "$local_file")
    remote_path="$REMOTE_GENERATED/$filename"
    if echo "$remote_files" | grep -qF "$remote_path"; then
      continue
    fi
    cp "$local_file" "$tmp_dir/$filename"
    to_push=$((to_push + 1))
  done

  if [ "$to_push" = "0" ]; then
    echo "All $local_count images already on remote. Nothing to push."
    return
  fi

  echo "Pushing $to_push new images ($local_count total local)..."
  for file in "$tmp_dir"/*.png; do
    filename=$(basename "$file")
    echo "  -> $filename"
    flyctl ssh sftp put "$file" "$REMOTE_GENERATED/$filename" -a "$APP_NAME" -q
  done

  flyctl ssh console -a "$APP_NAME" -q -C "chown -R nextjs:nodejs $REMOTE_GENERATED" 2>/dev/null || true
  echo "Done. $to_push images synced."
}

sync_db() {
  if [ ! -f "$LOCAL_DB" ]; then
    echo "No local database at $LOCAL_DB"
    exit 1
  fi

  echo "Checkpointing local WAL..."
  sqlite3 "$LOCAL_DB" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true

  tmp_remote=$(mktemp /tmp/remote_shnitzel_XXXXXX.db)
  trap "rm -f $tmp_remote" EXIT

  echo "Checkpointing remote WAL..."
  flyctl ssh console -a "$APP_NAME" -q -C "sqlite3 $REMOTE_DB 'PRAGMA wal_checkpoint(TRUNCATE);'" 2>/dev/null || true

  echo "Pulling remote database for merge..."
  flyctl ssh sftp get "$REMOTE_DB" "$tmp_remote" -a "$APP_NAME" -q 2>/dev/null || true

  if [ -s "$tmp_remote" ]; then
    echo "Merging remote rows into local first..."
    sqlite3 "$LOCAL_DB" <<SQL
ATTACH '$tmp_remote' AS remote;
INSERT OR IGNORE INTO news_items SELECT * FROM remote.news_items;
INSERT OR IGNORE INTO generations SELECT * FROM remote.generations;
DETACH remote;
SQL
  fi

  echo "Removing old remote DB..."
  flyctl ssh console -a "$APP_NAME" -q -C "rm -f $REMOTE_DB ${REMOTE_DB}-shm ${REMOTE_DB}-wal" 2>/dev/null || true

  echo "Pushing merged database to remote..."
  flyctl ssh sftp put "$LOCAL_DB" "$REMOTE_DB" -a "$APP_NAME" -q
  flyctl ssh console -a "$APP_NAME" -q -C "chown nextjs:nodejs $REMOTE_DB" 2>/dev/null || true
  local_count=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM generations;")
  echo "Done. Merged DB has $local_count generations."
  rm -f "$tmp_remote"
}

case "${1:-}" in
  images)
    sync_images
    ;;
  db)
    sync_db
    ;;
  all)
    sync_db
    sync_images
    ;;
  *)
    usage
    ;;
esac
