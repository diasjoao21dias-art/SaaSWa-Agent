---
name: NestJS Bootstrap decisions
description: Critical decisions for running the NestJS backend on Replit — decorator metadata, missing deps, versioning bypass.
---

## Decorator metadata (DI injection failure)

**Rule:** Never use `tsx` (esbuild) to run the NestJS `main.ts`. Use `@swc-node/register` instead.

**Why:** esbuild ignores `emitDecoratorMetadata: true` from tsconfig. NestJS DI relies on `reflect-metadata` to resolve constructor parameters; without it every injected service is `undefined` at runtime, producing `TypeError: Cannot read properties of undefined (reading 'getOrThrow')` at startup.

**How to apply:** Startup script uses `node -r @swc-node/register src/main.ts`. The `.swcrc` already has `decoratorMetadata: true`. The `tsx` runner is fine only for plain TS files without decorators (e.g. `dashboard-main.ts`).

## Missing direct dependencies

**Rule:** pnpm strict mode only exposes direct dependencies. Transitive deps are NOT importable even if in pnpm store.

**Why:** `multer` and `express` were imported in source files but listed only as peer/transitive deps. `@nestjs/platform-express` doesn't hoist `express` to the workspace root.

**How to apply:** If NestJS fails with `Cannot find module 'X'`, add `X` as a direct dep in `artifacts/api-server/package.json` via `pnpm add X`.

## Dashboard compat layer (VERSION_NEUTRAL + @RawResponse)

**Rule:** `DashboardCompatController` must use `{ version: VERSION_NEUTRAL }` and `@RawResponse()`.

**Why:** 
- `VERSION_NEUTRAL` is required to serve routes at `/api/conversations` (no `/v1/` prefix) since global `defaultVersion: '1'` applies to all controllers.
- `@RawResponse()` skips the global `TransformInterceptor` envelope `{data, meta}`. The React dashboard (generated orval client) expects raw arrays/objects matching the original Express API contract.

**How to apply:** Both decorators must always coexist on the compat controller. The `TransformInterceptor` checks `Reflector.getAllAndOverride(RAW_RESPONSE_KEY, ...)`.

## Redis startup

**Rule:** Start Redis with `redis-server --daemonize yes` before NestJS, not as a managed service.

**Why:** Replit has no Redis service. `redis-server` is installed as a nix system dep. BullMQ and CacheService connect to `localhost:6379` (no password in dev). The startup script at `scripts/start-api.sh` handles this.

## Prisma db push drops Drizzle tables

**Rule:** Never run `prisma db push` without first noting that it will DROP `dashboard_*` tables.

**Why:** Prisma schema doesn't include the Drizzle `dashboard_*` tables. Running `prisma db push` drops them. After any `db push`, re-run the seed SQL in `scripts/seed-dashboard.sql` (or the CodeExecution seed block).
