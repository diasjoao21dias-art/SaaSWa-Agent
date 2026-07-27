# WhatsApp AI Agent Platform (API Server)

Multi-tenant SaaS backend for managing WhatsApp AI agents, conversations, knowledge bases, and subscriptions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run prisma:seed` — seed global permissions (run once after first migration)
- `pnpm --filter @workspace/api-server run prisma:migrate:dev` — apply DB migrations (dev)
- `pnpm --filter @workspace/api-server run prisma:generate` — regenerate Prisma client after schema changes

## Required environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — min 32 chars; signs access tokens (15 min)
- `JWT_REFRESH_SECRET` — min 32 chars; signs refresh tokens (7 days)
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` — Redis for cache + queues
- `OPENAI_API_KEY` — OpenAI completions
- `EVOLUTION_API_BASE_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_WEBHOOK_SECRET` — WhatsApp gateway

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- API: NestJS 10 (Express adapter)
- DB: PostgreSQL + Prisma ORM
- Cache / Queues: Redis + BullMQ
- Auth: Passport JWT (access + refresh tokens), bcryptjs, UUID v4
- Validation: class-validator + class-transformer + Joi (config)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
