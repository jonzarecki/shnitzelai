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
  echo "  images   Pull remote generated images to local (incremental)"
  echo "  db       Merge remote DB rows into local DB"
  echo "  all      Pull both images and DB"
  exit 1
}

pull_images() {
  mkdir -p "$LOCAL_GENERATED"

  echo "Fetching remote image list..."
  remote_files=$(flyctl ssh sftp find "$REMOTE_GENERATED" -a "$APP_NAME" -q 2>/dev/null || echo "")

  if [ -z "$remote_files" ]; then
    echo "No remote images found."
    return
  fi

  tmp_dir=$(mktemp -d)
  trap "rm -rf $tmp_dir" EXIT

  to_pull=0
  for remote_path in $remote_files; do
    filename=$(basename "$remote_path")
    case "$filename" in
      *.png) ;;
      *) continue ;;
    esac
    local_path="$LOCAL_GENERATED/$filename"
    if [ -f "$local_path" ]; then
      continue
    fi
    echo "  <- $filename"
    flyctl ssh sftp get "$remote_path" "$local_path" -a "$APP_NAME" -q
    to_pull=$((to_pull + 1))
  done

  if [ "$to_pull" = "0" ]; then
    echo "All remote images already exist locally. Nothing to pull."
  else
    echo "Done. $to_pull images pulled."
  fi
}

merge_db() {
  tmp_remote=$(mktemp /tmp/remote_shnitzel_XXXXXX.db)
  trap "rm -f $tmp_remote" EXIT

  echo "Checkpointing remote WAL..."
  flyctl ssh console -a "$APP_NAME" -q -C "sqlite3 $REMOTE_DB 'PRAGMA wal_checkpoint(TRUNCATE);'" 2>/dev/null || true

  echo "Pulling remote database..."
  flyctl ssh sftp get "$REMOTE_DB" "$tmp_remote" -a "$APP_NAME" -q

  if [ ! -f "$LOCAL_DB" ]; then
    echo "No local database. Using remote as-is."
    cp "$tmp_remote" "$LOCAL_DB"
    echo "Done."
    return
  fi

  echo "Merging remote rows into local..."
  sqlite3 "$LOCAL_DB" <<SQL
ATTACH '$tmp_remote' AS remote;
INSERT OR IGNORE INTO news_items SELECT * FROM remote.news_items;
INSERT OR IGNORE INTO generations SELECT * FROM remote.generations;
DETACH remote;
SQL

  local_count=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM generations;")
  echo "Done. Local DB now has $local_count generations."
  rm -f "$tmp_remote"
}

case "${1:-}" in
  images)
    pull_images
    ;;
  db)
    merge_db
    ;;
  all)
    merge_db
    pull_images
    ;;
  *)
    usage
    ;;
esac
