#!/bin/sh
set -e

mkdir -p /data/generated
mkdir -p /data/logs
ln -sfn /data/generated /app/public/generated

exec node server.js
