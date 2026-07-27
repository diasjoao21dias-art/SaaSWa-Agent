import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PinoLogger } from '../logger/pino.logger';
import { REQUEST_ID_KEY } from '../constants';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & Record<string, unknown>>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = request[REQUEST_ID_KEY] as string ?? 'unknown';
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} — ${duration}ms`,
            'HTTP',
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${requestId}] ${method} ${url} ERROR — ${duration}ms — ${err.message}`,
            'HTTP',
          );
        },
      }),
    );
  }
}
