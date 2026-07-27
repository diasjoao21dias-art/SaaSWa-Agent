import { HttpStatus } from '@nestjs/common';
import { AppException } from './base.exception';

export class ForbiddenException extends AppException {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}
