import { HttpException, HttpStatus } from '@nestjs/common';

export interface ExceptionDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  message?: string;
}

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details: ExceptionDetails[];

  constructor(
    code: string,
    message: string,
    statusCode: HttpStatus,
    details: ExceptionDetails[] = [],
  ) {
    super(
      {
        error: {
          code,
          message,
          details,
        },
      },
      statusCode,
    );
    this.code = code;
    this.details = details;
  }
}
