---
name: Dev server startup
description: How to start the API server in development on Node.js v20
---

## Problem

`@swc-node/register` cannot be loaded with `node -r @swc-node/register` on Node.js v20 because pnpm hoists it to a versioned path that node's `-r` flag can't resolve by package name.

`tsx` (esbuild-based) ignores `emitDecoratorMetadata`, causing NestJS DI to receive `undefined` for injected services (symptoms: `Cannot read properties of undefined (reading 'getOrThrow')` in service constructors).

## Fix

Resolve the path dynamically in `scripts/start-api.sh`:

```bash
echo "==> Starting NestJS API..."
SWC_REGISTER=$(node -e "console.log(require.resolve('@swc-node/register'))")
exec node -r "$SWC_REGISTER" src/main.ts
```

The `node -e "require.resolve(...)"` runs from `artifacts/api-server/` where the package resolves correctly via pnpm's node_modules symlinks. The `.swcrc` file has `decoratorMetadata: true` which enables proper reflect-metadata emission for NestJS DI.

**Why:** tsx/esbuild doesn't support `emitDecoratorMetadata`; @swc-node/register + .swcrc does. pnpm hoisting puts the package at a versioned path that isn't directly requireable by name from the shell.

## Expected startup

Redis starts first (daemonized), then NestJS loads. BullMQ emits `IMPORTANT! Eviction policy is allkeys-lru` warnings — these are harmless in dev.

## Required env vars to fully start

DATABASE_URL, REDIS_HOST/PORT (localhost:6379 defaults work), JWT_ACCESS_SECRET, JWT_REFRESH_SECRET. OpenAI and Evolution API have dev placeholders so they're optional.
