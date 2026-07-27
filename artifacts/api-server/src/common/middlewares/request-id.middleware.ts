import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { REQUEST_ID_KEY } from '../constants';

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & Record<string, unknown>, _res: Response, next: NextFunction): void {
    const existingId = req.headers[REQUEST_ID_HEADER] as string | undefined;
    const requestId = existingId ?? uuidv4();
    req[REQUEST_ID_KEY] = requestId;
    // Echo back in response header for client tracing
    _res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
