import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { REQUEST_ID_KEY } from '../constants';

export interface TransformedResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Wraps every successful response in a standardized envelope.
 * Paginated responses already include their own meta and are passed through.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [REQUEST_ID_KEY]?: string }>();

    const requestId = request[REQUEST_ID_KEY] ?? 'unknown';

    return next.handle().pipe(
      map((data) => {
        // If data already has the paginated shape { data, meta }, merge meta
        if (
          data &&
          typeof data === 'object' &&
          'data' in (data as object) &&
          'meta' in (data as object)
        ) {
          const paginated = data as { data: unknown; meta: Record<string, unknown> };
          return {
            data: paginated.data,
            meta: {
              ...paginated.meta,
              requestId,
              timestamp: new Date().toISOString(),
            },
          } as unknown as TransformedResponse<T>;
        }

        return {
          data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
