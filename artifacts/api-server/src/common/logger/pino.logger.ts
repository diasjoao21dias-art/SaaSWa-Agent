import { Injectable, LoggerService, Scope } from '@nestjs/common';
import pino, { Logger } from 'pino';

@Injectable({ scope: Scope.DEFAULT })
export class PinoLogger implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    const isDev = process.env['NODE_ENV'] !== 'production';

    this.logger = pino({
      level: isDev ? 'debug' : 'info',
      ...(isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
              },
            },
          }
        : {
            formatters: {
              level: (label) => ({ level: label }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
          }),
    });
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }

  getLogger(): Logger {
    return this.logger;
  }
}
