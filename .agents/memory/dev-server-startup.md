---
name: Dev server startup
description: How to start the API server in development on Node.js v20
---

## Problem

@swc-node/register/esm-register only exports an ESM import path, not a CommonJS require path. Node.js v20 cannot load it with -r flag.

## Fix

Use tsx instead of swc-node for the dev script:
```
"dev": "NODE_ENV=development ./node_modules/.bin/tsx src/main.ts"
```

tsx v4.23.1 handles TypeScript + decorators + emitDecoratorMetadata correctly.

**Why:** tsx is already in devDependencies (catalog:) and supports Node.js v20 natively.

## Expected startup failure

When env vars are missing, the server logs:
`Config validation error: "JWT_ACCESS_SECRET" is required...`
This is expected Joi validation — not a code bug. The app correctly boots and loads all modules before this check.

## Required env vars to fully start

DATABASE_URL, REDIS_HOST/PORT/PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY, EVOLUTION_API_BASE_URL, EVOLUTION_API_KEY, EVOLUTION_WEBHOOK_SECRET
