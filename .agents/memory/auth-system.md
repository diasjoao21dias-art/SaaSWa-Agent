---
name: Auth system design
description: Key decisions for the NestJS auth/RBAC system in artifacts/api-server
---

## Guard registration order (AppModule APP_GUARD)
ThrottlerGuard → JwtAuthGuard → TenantGuard → RolesGuard → PermissionsGuard

**Why:** NestJS runs APP_GUARDs in registration order. JWT must populate request.user before Tenant/Roles/Permissions guards run.

**How to apply:** When adding a new global guard, register it after PermissionsGuard unless it needs to run earlier.

## @Public() must be checked in TenantGuard and RolesGuard
Both guards were made global. Without the IS_PUBLIC_KEY check, @Public() routes (login, register, forgot-password) would fail because request.user is undefined.

**Why:** NestJS does not stop the guard chain when a prior guard returns true for @Public() — each APP_GUARD runs independently.

**How to apply:** Any new global guard MUST check IS_PUBLIC_KEY at the top of canActivate and return true if set.

## Permission cache invalidation
PermissionsGuard caches permission keys per-user in Redis under `perms:<userId>` (TTL = CACHE_TTL_MEDIUM = 5 min).
When a user's roles or direct permissions change, the caller MUST bust this key via `cacheService.del('perms:<userId>')`.

## Password reset tokens
Stored in the Token table (type=PASSWORD_RESET) and mirrored in Redis (`pwd_reset:<token>` → userId, TTL 15 min).
Single-use: consumed on first valid use. Redis fast-path checked first, then DB fallback.

## System roles per tenant
Created automatically in TenantsRepository.createSystemRoles() when a tenant registers.
Requires permissions to be seeded first (`pnpm --filter @workspace/api-server run prisma:seed`).
If seed hasn't run, roles are created empty (best-effort, no crash).

Slug → UserRole mapping:
  admin  → ADMIN  (Administrador)
  agent  → AGENT  (Funcionário)
  viewer → VIEWER (Cliente)
  (OWNER bypasses all checks, no system role needed)
