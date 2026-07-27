import { HttpStatus } from '@nestjs/common';
import { AppException } from './base.exception';

export class UnauthorizedException extends AppException {
  constructor(message = 'Authentication is required to access this resource.') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}
