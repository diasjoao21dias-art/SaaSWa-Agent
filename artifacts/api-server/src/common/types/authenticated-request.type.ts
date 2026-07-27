import type { Request } from 'express';

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  email: string;
  role: string;
  jti: string;       // JWT ID for token rotation
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
