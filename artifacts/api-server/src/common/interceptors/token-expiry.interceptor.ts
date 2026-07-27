import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Injects expiry-warning headers when the access token is close to expiring.
 *
 * Headers added when within the warning threshold:
 *   X-Token-Expiring: true
 *   X-Token-Expires-In: <seconds remaining>
 *
 * The client should use these headers to proactively call POST /auth/refresh
 * before the token actually expires, enabling seamless auto-refresh.
 */
const EXPIRY_WARNING_THRESHOLD_SECONDS = 120; // warn when ≤ 2 minutes remain

@Injectable()
export class TokenExpiryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const request = http.getRequest<AuthenticatedRequest>();
        const response = http.getResponse<Response>();

        // `exp` is set by passport-jwt on the decoded payload
        const exp = (request.user as { exp?: number } | undefined)?.exp;
        if (!exp) return;

        const secondsLeft = exp - Math.floor(Date.now() / 1000);

        if (secondsLeft > 0 && secondsLeft <= EXPIRY_WARNING_THRESHOLD_SECONDS) {
          response.setHeader('X-Token-Expiring', 'true');
          response.setHeader('X-Token-Expires-In', String(secondsLeft));
        }
      }),
    );
  }
}
