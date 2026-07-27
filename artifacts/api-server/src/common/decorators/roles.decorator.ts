import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, UserRole } from '../constants';

/**
 * Restricts a route to users with specific roles.
 * Must be used alongside JwtAuthGuard and RolesGuard.
 *
 * @example
 * @Roles(UserRole.OWNER, UserRole.ADMIN)
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
