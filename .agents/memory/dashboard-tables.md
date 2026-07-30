---
name: Dashboard tables
description: The dashboard_* tables used by DashboardCompatService are separate from the Prisma schema and must be created manually.
---

## Problem

`DashboardCompatService` (`artifacts/api-server/src/modules/dashboard-compat/dashboard-compat.service.ts`) queries eight `dashboard_*` tables using raw SQL. These tables are NOT in the Prisma schema and are not created by `prisma db push` or migrations.

They are defined as Drizzle schemas in `lib/db/src/schema/` — but Drizzle migrations are never run in this project.

## Tables required

- `dashboard_conversations`
- `dashboard_clients`
- `dashboard_agents`
- `dashboard_attendances`
- `dashboard_users`
- `dashboard_plans`
- `dashboard_transactions`
- `dashboard_integrations`

## Fix

Create them manually via SQL (see Drizzle schema files in `lib/db/src/schema/` for column definitions). The tables are simple — no foreign keys, TEXT primary keys (UUID strings), TIMESTAMPTZ timestamps.

**Why:** The project has two parallel data layers — Prisma (NestJS domain model) and Drizzle (dashboard compat layer). The Drizzle tables must be created out-of-band; they are never touched by Prisma migrations.

## Migration baseline note

The Prisma migrations (`20250727000001_add_pgvector`, etc.) are incremental-only — they assume a base schema that was never captured. On a fresh database, use `prisma db push` to create the full schema, then `prisma migrate resolve --applied <name>` for each migration to baseline them.
