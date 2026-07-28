/**
 * JwtPayload — claims embedded in every access token.
 *
 * IMPORTANT: keep this interface in sync with:
 *   - `common/types/authenticated-request.type.ts` (the JwtPayload re-export there)
 *   - `auth.service.ts` (generateTokenPair)
 *   - `auth.repository.ts` (select projections that feed these claims)
 */
export interface JwtPayload {
  sub: string;          // userId
  tenantId: string;
  email: string;
  role: string;
  jti: string;          // JWT ID — used for token rotation tracking
  /**
   * Platform-level superadmin flag.
   * When true, the bearer may access cross-tenant admin routes
   * (TenantsController.findAll/remove, PlansController admin routes).
   * Derived from `users.is_super_admin` at login time; false when absent
   * (backwards-compatible with tokens issued before the column was added).
   */
  isSuperAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;          // userId
  tenantId: string;
  jti: string;          // Unique token ID stored in Redis
  type: 'refresh';
}
