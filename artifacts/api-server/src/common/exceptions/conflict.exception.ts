import { HttpStatus } from '@nestjs/common';
import { AppException } from './base.exception';

export class ConflictException extends AppException {
  constructor(resource: string, field: string, value: unknown) {
    super(
      `${resource.toUpperCase()}_ALREADY_EXISTS`,
      `A ${resource} with ${field} "${String(value)}" already exists.`,
      HttpStatus.CONFLICT,
      [{ field, value, constraint: 'unique' }],
    );
  }
}
