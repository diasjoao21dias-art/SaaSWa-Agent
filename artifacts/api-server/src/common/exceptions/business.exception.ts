import { HttpStatus } from '@nestjs/common';
import { AppException, ExceptionDetails } from './base.exception';

export class BusinessException extends AppException {
  constructor(
    code: string,
    message: string,
    details: ExceptionDetails[] = [],
  ) {
    super(code, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}
