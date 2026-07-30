#!/usr/bin/env bash
# Startup script for the API server
# Starts Redis (if not running), then the NestJS server

set -e

echo "==> Starting Redis..."
if ! redis-cli ping &>/dev/null 2>&1; then
  REDIS_ARGS=(
    --daemonize yes
    --logfile /tmp/redis-api.log
    --port "${REDIS_PORT:-6379}"
    --maxmemory 128mb
    --maxmemory-policy allkeys-lru
  )
  if [ -n "${REDIS_PASSWORD:-}" ]; then
    REDIS_ARGS+=(--requirepass "${REDIS_PASSWORD}")
  fi
  redis-server "${REDIS_ARGS[@]}"
  echo "==> Redis started"
  sleep 0.5
else
  echo "==> Redis already running"
fi

echo "==> Starting NestJS API..."
SWC_REGISTER=$(node -e "console.log(require.resolve('@swc-node/register'))")
exec node -r "$SWC_REGISTER" src/main.ts
