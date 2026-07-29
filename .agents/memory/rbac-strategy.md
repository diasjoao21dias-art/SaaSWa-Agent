---
name: RBAC strategy
description: Single RBAC strategy chosen for the platform; which guards exist, how they're applied, and what was removed.
---

## Decision: @Roles() + RolesGuard as the sole RBAC mechanism

PermissionsGuard and @RequirePermissions() were removed entirely — they were registered globally but called by zero controllers. auth.repository.ts had a dead `findUserPermissionKeys()` method written in anticipation of the guard; that was removed too.

**Why:** @Roles() was already used in 8/14 controllers. Granular permissions add DB/Redis overhead on every request with no business value for V1.0 (50-company launch). Role-based is sufficient.

## Guard pipeline (AppModule — order matters):
1. ThrottlerGuard — rate limiting
2. JwtAuthGuard — JWT auth; @Public() bypasses
3. TenantGuard — validates tenantId from JWT, checks tenant ACTIVE in DB; @SkipTenantGuard() or @Public() bypass
4. RolesGuard — @Roles() decorator; OWNER bypasses all checks; no decorator = any authenticated user

## Standard controller pattern (after D11):
- NO local @UseGuards() for guards already global — removes noise and prevents double-execution
- @Public() — unauthenticated route (login, register, public plans, evolution webhook)
- @SuperAdmin() — composed decorator: SkipTenantGuard + UseGuards(SuperAdminGuard) + Swagger; for cross-tenant platform routes
- @Roles(OWNER, ADMIN) — tenant write operations
- @Roles(OWNER, ADMIN, AGENT) — operations agents can perform (send messages, manage conversations/customers)
- (no decorator) — any authenticated tenant user (reads)

## Security fixes applied:
- GET /v1/tenants → @SuperAdmin() (was @Roles(OWNER) — any tenant owner could enumerate ALL tenants)
- DELETE /v1/tenants/:id → @SuperAdmin() (was @Roles(OWNER) — any owner could delete any tenant)
- GET/POST/DELETE /v1/plans (admin routes) → @SuperAdmin() (was @Roles(OWNER) — any owner could create/delete global plans)
- GET /v1/tenants/:id + PATCH /v1/tenants/:id → enforce id === tenant.id in controller (own-tenant scoping)

## Role matrix (what each role can do):
| Resource | VIEWER | AGENT | ADMIN | OWNER |
|---------|--------|-------|-------|-------|
| agents | read | read | all | bypass |
| conversations | read | read+write | all | bypass |
| customers | read | read+write | all | bypass |
| customers block/unblock | — | — | yes | bypass |
| knowledge | read | read | all | bypass |
| messages (send) | — | yes | yes | bypass |
| prompts | read | read | all | bypass |
| subscriptions active/history | — | — | yes | bypass |
| subscriptions create/cancel | — | — | — | yes |
| users | — | — | all | bypass |
| webhooks | — | — | all | bypass |
| whatsapp | read | read | all | bypass |

## Type issue noted (D7):
auth.controller.ts imported RefreshTokenPayload from authenticated-request.type.ts (wrong file).
Fixed: now imports from auth/interfaces/jwt-payload.interface.ts. The type itself is a D7 dedup task.

**How to apply:** When adding a new controller, never add @UseGuards() for global guards. Use only @Public()/@SuperAdmin()/@Roles() decorators. Platform-level routes (cross-tenant) must use @SuperAdmin().
