import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { SkipTenantGuard } from './skip-tenant-guard.decorator';

/**
 * @SuperAdmin() — Composed decorator for platform-level admin routes.
 *
 * Combines three concerns in one decorator to prevent accidental
 * misconfiguration:
 *
 *   1. `@SkipTenantGuard()` — Platform admin routes are cross-tenant by
 *      definition; the global TenantGuard must not block them.
 *
 *   2. `@UseGuards(SuperAdminGuard)` — Verifies that `request.user.isSuperAdmin`
 *      is true (claim carried in the JWT; never exposed on public endpoints).
 *
 *   3. Swagger annotations — Keeps API documentation accurate for every route
 *      that uses this decorator without extra boilerplate.
 *
 * Usage:
 * ```typescript
 * @SuperAdmin()
 * @Get('all')
 * findAll() { ... }
 * ```
 *
 * Never use `@SuperAdmin()` together with `@SkipTenantGuard()` or
 * `@Roles(UserRole.OWNER)` — the decorator already handles both.
 */
export const SuperAdmin = () =>
  applyDecorators(
    // Always skip tenant resolution — platform routes are cross-tenant
    SkipTenantGuard(),
    // Enforce the isSuperAdmin JWT claim; runs after global JwtAuthGuard
    UseGuards(SuperAdminGuard),
    // Swagger: mark route as requiring Bearer auth
    ApiBearerAuth('access-token'),
    // Swagger: document expected error responses
    ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' }),
    ApiForbiddenResponse({
      description:
        'Platform administrator access required. ' +
        'Caller does not have the superadmin flag.',
    }),
  );
