import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PinoLogger } from '../logger/pino.logger';
import { REQUEST_ID_KEY } from '../constants';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: Request & Record<string, unknown>, _res: Response, next: NextFunction): void {
    const requestId = req[REQUEST_ID_KEY] as string ?? 'unknown';
    const { method, url } = req;

    this.logger.log(
      `[${requestId}] → ${method} ${url}`,
      'HTTP',
    );

    next();
  }
}
