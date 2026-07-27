import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from '../logger/pino.logger';
import { REQUEST_ID_KEY } from '../constants';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    path: string;
    method: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request as Record<string, unknown>)[REQUEST_ID_KEY] as string ?? 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred. Please try again later.';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse
      ) {
        const err = (exceptionResponse as { error: { code?: string; message?: string; details?: unknown[] } }).error;
        errorCode = err.code ?? String(statusCode);
        message = err.message ?? exception.message;
        details = err.details ?? [];
      } else if (typeof exceptionResponse === 'object' && 'message' in (exceptionResponse as object)) {
        // class-validator errors come as { message: string[] }
        const validationResp = exceptionResponse as { message: string | string[]; error?: string };
        errorCode = 'VALIDATION_ERROR';
        message = 'Validation failed. Please check the provided data.';
        details = Array.isArray(validationResp.message)
          ? validationResp.message.map((m) => ({ message: m }))
          : [{ message: validationResp.message }];
      } else {
        message = exception.message;
        errorCode = `HTTP_${statusCode}`;
      }
    } else if (exception instanceof Error) {
      // Log unexpected errors with full stack
      this.logger.error(
        exception.message,
        exception.stack,
        'AllExceptionsFilter',
      );
    }

    const errorBody: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        details: details.length > 0 ? details : undefined,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // Don't log 401/403/404 as errors — they are expected
    if (statusCode >= 500) {
      this.logger.error(
        `[${requestId}] ${statusCode} ${request.method} ${request.url} — ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
        'AllExceptionsFilter',
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `[${requestId}] ${statusCode} ${request.method} ${request.url} — ${errorCode}`,
        'AllExceptionsFilter',
      );
    }

    response.status(statusCode).json(errorBody);
  }
}
