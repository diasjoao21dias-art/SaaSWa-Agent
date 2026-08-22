# Base44 Dev Environment

## Quick start
```bash
docker compose -f docker-compose.base44.yml up -d
```
The dashboard is on port 3000; the NestJS API is internal on port 3001 (proxied via Vite).

## Demo credentials
- Email: `admin@demo.com`
- Password: `password123`

## Architecture
- **Monorepo**: pnpm 10 workspace (`pnpm-workspace.yaml`)
- **API**: `artifacts/api-server/` — NestJS 10, runs via `@swc-node/register` (no build step) with `node --watch` for live reload
- **Dashboard**: `artifacts/saas-dashboard/` — React 19 + Vite 7 dev server with HMR
- **Shared libs**: `lib/api-client-react` (generated API client), `lib/db` (Drizzle schema for dashboard_* tables)
- **DB**: PostgreSQL 16 + pgvector; Prisma for the main schema, Drizzle for dashboard_* tables
- **Cache/Queues**: Redis 7 (BullMQ)

## Key setup notes
- **pnpm version must be 10** — the lockfile was created with pnpm 10; pnpm 9 fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
- **Use `node:20` (glibc), NOT `node:20-alpine`** — the `pnpm-workspace.yaml` overrides exclude musl platform packages (`@rollup/rollup-linux-x64-musl`, `lightningcss-linux-x64-musl`, etc.), so Alpine can't run Vite/Rollup.
- **Drizzle tables are created via SQL** (`docker/postgres/dashboard-tables.sql`), not `drizzle-kit push` — drizzle-kit 0.31.10 requires a TTY for interactive schema-conflict prompts, which isn't available in non-interactive containers. The SQL file is mounted into `docker-entrypoint-initdb.d/` with a sort prefix after `init.sql`.
- **Prisma `db push`** is used instead of `migrate deploy` — the migration history is incomplete (per `replit.md`). The setup runs `prisma db push --accept-data-loss`.
- **Vite proxy**: `vite.config.ts` has a `server.proxy` for `/api` → `API_PROXY_TARGET` (default `http://localhost:3001`). This is the single-origin wiring so the dashboard's relative `/api/...` calls reach the NestJS API.
- **External secrets**: `OPENAI_API_KEY` is delivered via `/run/base44/app.env`. It's optional in dev mode (the app boots without it; AI features won't work). `EVOLUTION_API_KEY` / `EVOLUTION_WEBHOOK_SECRET` are also optional in dev.
- **`minimumReleaseAge: 1440`** in `pnpm-workspace.yaml` — not an issue since all locked packages are well over 1 day old.

## Verifying it works
```bash
# Dashboard serves
curl -sf http://localhost:3000/

# API health via Vite proxy
curl -sf http://localhost:3000/api/healthz

# Login
curl -sf -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"password123"}'
```

## Services
| Service  | Image               | Port | Purpose                          |
|----------|---------------------|------|----------------------------------|
| postgres | pgvector/pgvector:pg16 | 5432 | DB (Prisma + dashboard_* tables) |
| redis    | redis:7-alpine      | 6379 | Cache + BullMQ queues           |
| api      | node:20             | 3001 | NestJS dev (`node --watch`)      |
| web      | node:20             | 3000 | Vite dev (HMR, host port 3000)   |
| setup    | node:20             | —    | One-shot: install + DB push + seed |
