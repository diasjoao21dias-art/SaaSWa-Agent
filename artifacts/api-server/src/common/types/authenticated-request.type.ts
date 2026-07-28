import type { Request } from 'express';

/**
 * JwtPayload — the decoded access-token claims attached to `request.user`
 * by Passport's JwtStrategy after successful bearer-token validation.
 *
 * Keep in sync with `modules/auth/interfaces/jwt-payload.interface.ts`.
 */
export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  email: string;
  role: string;
  jti: string;       // JWT ID for token rotation
  /**
   * Platform-level superadmin flag (see `users.is_super_admin`).
   * Absent on tokens issued before the column was added — treated as false.
   */
  isSuperAdmin?: boolean;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  status: string;
  planId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  tenant: TenantContext;
  requestId: string;
}
