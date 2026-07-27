import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/base.exception';

export class UserNotFoundException extends AppException {
  constructor(id: string) {
    super('USER_NOT_FOUND', `User "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class UserEmailTakenException extends AppException {
  constructor(email: string) {
    super('USER_EMAIL_TAKEN', `A user with email "${email}" already exists in this tenant.`, HttpStatus.CONFLICT);
  }
}

export class CannotDeleteOwnerException extends AppException {
  constructor() {
    super('CANNOT_DELETE_OWNER', 'The tenant owner account cannot be deleted.', HttpStatus.FORBIDDEN);
  }
}

export class PlanUserLimitException extends AppException {
  constructor(limit: number) {
    super('PLAN_USER_LIMIT_REACHED', `Your plan allows a maximum of ${limit} users.`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
