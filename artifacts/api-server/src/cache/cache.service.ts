import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string | undefined>('redis.password'),
      db: this.configService.get<number>('redis.db', 0),
      tls: this.configService.get<boolean>('redis.tls') ? {} : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting...'));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** Atomic increment — used for rate limiting */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /** Increment with expiry — idempotent sliding window rate limit */
  async incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const pipeline = this.client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttlSeconds);
    const results = await pipeline.exec();
    return results?.[0]?.[1] as number ?? 0;
  }

  /** Hash operations — for storing structured objects */
  async hset(key: string, field: string, value: unknown): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  // ─── List operations — used by ConversationMemoryService ─────────────────

  /**
   * LPUSH: insere valor no topo da lista (newest-first ordering).
   * Retorna o novo tamanho da lista.
   */
  async lpush(key: string, value: string): Promise<number> {
    return this.client.lpush(key, value);
  }

  /**
   * LTRIM: mantém apenas os elementos entre start e stop (inclusive).
   * Usado para limitar o tamanho da janela de contexto.
   */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.ltrim(key, start, stop);
  }

  /**
   * LRANGE: retorna elementos da lista entre start e stop.
   * LRANGE 0 -1 = toda a lista.
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  /**
   * Operação atômica: LPUSH + LTRIM + EXPIRE em pipeline.
   * Usada pelo ConversationMemoryService para empurrar mensagem, manter
   * janela e renovar TTL em uma única round-trip ao Redis.
   *
   * @param key       Chave da lista
   * @param value     Valor serializado (JSON string)
   * @param maxLen    Tamanho máximo da lista após trim (windowSize)
   * @param ttlSeconds TTL deslizante em segundos
   */
  async lpushTrimExpire(
    key: string,
    value: string,
    maxLen: number,
    ttlSeconds: number,
  ): Promise<void> {
    const pipeline = this.client.pipeline();
    pipeline.lpush(key, value);
    pipeline.ltrim(key, 0, maxLen - 1);
    pipeline.expire(key, ttlSeconds);
    await pipeline.exec();
  }

  getClient(): Redis {
    return this.client;
  }
}
