import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  PERMISSIONS_KEY,
  IS_PUBLIC_KEY,
  UserRole,
  CACHE_KEY_PERMISSIONS,
  CACHE_TTL_MEDIUM,
} from '../constants';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Enforces granular, per-route permission checks.
 * Used together with @RequirePermissions('resource:action').
 *
 * Permission resolution order (OR merge):
 *   1. System roles assigned to the user (via UserRole_ pivot → RolePermission)
 *   2. Direct UserPermission grants
 *
 * Result is cached per-user in Redis (CACHE_TTL_MEDIUM).
 * Cache is invalidated on permission changes — callers must bust `permissions:<userId>`.
 *
 * OWNER role bypasses all checks.
 * Routes marked @Public() are always skipped.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public routes skip all permission checks
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermissions() decorator → pass through (rely on RolesGuard)
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) return false;

    // OWNER bypasses all permission checks
    if ((user.role as string) === UserRole.OWNER) return true;

    const userPermissions = await this.resolvePermissions(user.sub, user.tenantId);

    const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private async resolvePermissions(
    userId: string,
    tenantId: string,
  ): Promise<Set<string>> {
    const cacheKey = `${CACHE_KEY_PERMISSIONS}${userId}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return new Set(cached);

    const [rolePerms, directPerms] = await Promise.all([
      // Permissions via system roles assigned to the user
      this.prisma.rolePermission.findMany({
        where: {
          deletedAt: null,
          role: {
            tenantId,
            isSystem: true,
            deletedAt: null,
            userRoles: {
              some: { userId, deletedAt: null },
            },
          },
        },
        include: { permission: { select: { key: true } } },
      }),
      // Direct user permission grants
      this.prisma.userPermission.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { permission: { select: { key: true } } },
      }),
    ]);

    const keys = [
      ...rolePerms.map((rp) => rp.permission.key),
      ...directPerms.map((up) => up.permission.key),
    ];

    await this.cache.set(cacheKey, keys, CACHE_TTL_MEDIUM);
    return new Set(keys);
  }
}
