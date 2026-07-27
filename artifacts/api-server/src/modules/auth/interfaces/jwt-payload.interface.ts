export interface JwtPayload {
  sub: string;      // userId
  tenantId: string;
  email: string;
  role: string;
  jti: string;      // JWT ID — used for token rotation tracking
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;      // userId
  tenantId: string;
  jti: string;      // Unique token ID stored in Redis
  type: 'refresh';
}
