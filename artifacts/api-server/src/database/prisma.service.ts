import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    // Log slow queries (> 500ms) in development
    if (process.env['NODE_ENV'] === 'development') {
      // @ts-expect-error Prisma event type
      this.$on('query', (e: { query: string; duration: number }) => {
        if (e.duration > 500) {
          this.logger.warn(
            `Slow query (${e.duration}ms): ${e.query.substring(0, 200)}`,
          );
        }
      });
    }

    // @ts-expect-error Prisma event type
    this.$on('error', (e: { message: string; target: string }) => {
      this.logger.error(`Prisma error on ${e.target}: ${e.message}`);
    });

    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Soft-delete helper — sets deletedAt to now() instead of removing the row.
   */
  async softDelete(model: string, id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
