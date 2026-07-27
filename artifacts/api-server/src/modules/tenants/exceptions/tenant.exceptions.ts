import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class TenantNotFoundException extends AppException {
  constructor(id: string) {
    super('TENANT_NOT_FOUND', `Tenant with id "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class TenantSlugTakenException extends AppException {
  constructor(slug: string) {
    super('TENANT_SLUG_TAKEN', `The slug "${slug}" is already in use.`, HttpStatus.CONFLICT);
  }
}

export class TenantSuspendedException extends AppException {
  constructor() {
    super('TENANT_SUSPENDED', 'This tenant account is currently suspended.', HttpStatus.FORBIDDEN);
  }
}
