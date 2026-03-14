#!/bin/sh
set -e

mkdir -p /data/generated
ln -sfn /data/generated /app/public/generated

exec node server.js
