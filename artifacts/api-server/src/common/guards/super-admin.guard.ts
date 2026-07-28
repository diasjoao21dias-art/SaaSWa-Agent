import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * SuperAdminGuard — Platform-level administrator check.
 *
 * Enforces that the authenticated user has `isSuperAdmin = true` in their JWT
 * payload before accessing cross-tenant administrative routes such as:
 *   - `GET /api/v1/tenants`       (list all tenants in the platform)
 *   - `DELETE /api/v1/tenants/:id` (delete any tenant)
 *   - `POST /api/v1/plans`         (create a global subscription plan)
 *   - `GET /api/v1/plans/all`      (list all plans, including private ones)
 *   - `DELETE /api/v1/plans/:id`   (delete a global plan)
 *
 * Architecture notes:
 *   - This guard MUST run after JwtAuthGuard (which populates `request.user`).
 *     Since JwtAuthGuard is registered globally first, this is always satisfied.
 *   - The `isSuperAdmin` flag is read from the JWT payload (set at login time
 *     from the `users.is_super_admin` DB column), so this guard never hits the
 *     database — it is a pure, synchronous check.
 *   - The flag is intentionally separate from the tenant-scoped UserRole enum
 *     (OWNER / ADMIN / AGENT / VIEWER). A superadmin may also be an OWNER of
 *     their own tenant; the two concepts are orthogonal.
 *
 * Apply via the `@SuperAdmin()` composed decorator — do not apply this guard
 * directly to avoid forgetting the `@SkipTenantGuard()` pairing.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    // JwtAuthGuard already ran — user must be present; guard defensively anyway
    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication required.',
      );
    }

    if (request.user.isSuperAdmin !== true) {
      throw new ForbiddenException(
        'Platform administrator access required. ' +
        'This action is restricted to superadmins only.',
      );
    }

    return true;
  }
}
