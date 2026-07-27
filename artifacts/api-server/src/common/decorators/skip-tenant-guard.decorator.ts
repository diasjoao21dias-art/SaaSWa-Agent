import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_GUARD_KEY } from '../constants';

/**
 * Skips the TenantGuard for platform-level admin routes.
 */
export const SkipTenantGuard = () => SetMetadata(SKIP_TENANT_GUARD_KEY, true);
