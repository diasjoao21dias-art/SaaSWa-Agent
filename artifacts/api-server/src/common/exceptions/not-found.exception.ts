import { HttpStatus } from '@nestjs/common';
import { AppException } from './base.exception';

export class NotFoundException extends AppException {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource.toUpperCase()}_NOT_FOUND`,
      identifier
        ? `${resource} with identifier "${identifier}" was not found.`
        : `${resource} was not found.`,
      HttpStatus.NOT_FOUND,
    );
  }
}
