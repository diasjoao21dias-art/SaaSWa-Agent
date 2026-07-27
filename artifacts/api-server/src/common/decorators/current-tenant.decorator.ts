import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Extracts the resolved tenant from the request object.
 * Requires TenantGuard to have run before this decorator is evaluated.
 *
 * @example
 * @Get('config')
 * getConfig(@CurrentTenant() tenant: TenantContext) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof AuthenticatedRequest['tenant'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenant = request.tenant;
    return data ? tenant?.[data] : tenant;
  },
);
