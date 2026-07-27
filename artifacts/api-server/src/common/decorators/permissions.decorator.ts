import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants';

/**
 * Requires the authenticated user to hold ALL listed permission keys.
 * Works alongside PermissionsGuard (registered globally).
 *
 * Permission keys follow the format `resource:action`, e.g.:
 *   conversations:read, agents:write, users:delete
 *
 * OWNER role bypasses all permission checks automatically.
 *
 * @example
 * @RequirePermissions('conversations:read', 'customers:read')
 * @Get()
 * findAll() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
