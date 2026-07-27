import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  SKIP_TENANT_GUARD_KEY,
  CACHE_KEY_TENANT,
  CACHE_TTL_MEDIUM,
} from '../constants';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant information missing from token.');
    }

    // Try cache first
    const cacheKey = `${CACHE_KEY_TENANT}${tenantId}`;
    const cached = await this.cache.get<{ id: string; name: string; slug: string; status: string; planId: string | null }>(cacheKey);

    if (cached) {
      request.tenant = cached;
      return true;
    }

    // Fetch from database
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { id: true, name: true, slug: true, status: true, subscriptions: { select: { planId: true }, where: { status: 'ACTIVE' }, take: 1 } },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found or has been deactivated.');
    }

    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (tenant.status === 'CANCELED') {
      throw new ForbiddenException(
        'Your account has been canceled. Please contact support to reactivate.',
      );
    }

    const tenantContext = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      planId: tenant.subscriptions[0]?.planId ?? null,
    };

    await this.cache.set(cacheKey, tenantContext, CACHE_TTL_MEDIUM);
    request.tenant = tenantContext;

    return true;
  }
}
