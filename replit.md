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
- `APP_PUBLIC_URL` — Public URL of this API (e.g. `https://myapp.replit.app`); used to auto-register Evolution webhook URLs

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

- **EvolutionApiService is pure infrastructure** (`src/evolution/`): all HTTP calls to Evolution API live here. No Prisma, no business rules. Every other layer uses this service — never raw axios.
- **WhatsappService is the business orchestrator**: applies tenant isolation, validates state (e.g. only CONNECTED numbers can send), delegates HTTP to EvolutionApiService and async sends to BullMQ.
- **All sends go through BullMQ** (`whatsapp-outbound` queue): text, image, audio, video, document, location. Supports 5 retries with exponential backoff. Job type is `send-whatsapp-message`.
- **Auto-reconnect via BullMQ**: when `connection.update` event arrives with `state=close`, `WebhookInboundConsumer` schedules a `reconnect-whatsapp-instance` job (15s delay, 8 retries). Skipped for statusReason 401/403/515 (session expired / unauthorized).
- **Webhook event routing**: `WebhookInboundConsumer` handles all Evolution events — `messages.upsert` (all media types), `messages.update` (delivery receipts), `connection.update` (reconnect), `qrcode.updated` (QR refresh).
- **Session persistence**: disconnect reason stored in `WhatsappNumber.sessionData` (JSONB). Session restore is managed by Evolution API itself (Baileys); we just trigger `instance/restart`.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
