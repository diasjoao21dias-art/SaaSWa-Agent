import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // ─── App ─────────────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_GLOBAL_PREFIX: Joi.string().default('api'),
  APP_ALLOWED_ORIGINS: Joi.string().default('*'),
  APP_PUBLIC_URL: Joi.string().uri().allow('').optional(),

  // ─── Database ─────────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string().uri().required(),

  // ─── Redis ────────────────────────────────────────────────────────────────────
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_DB: Joi.number().min(0).max(15).default(0),

  // ─── JWT ──────────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // ─── OpenAI ───────────────────────────────────────────────────────────────────
  // Required in production; optional in development (AI features won't work without it)
  OPENAI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('sk-dev-placeholder'),
  }),
  OPENAI_ORGANIZATION: Joi.string().allow('').optional(),
  OPENAI_DEFAULT_MODEL: Joi.string().default('gpt-4o-mini'),
  OPENAI_TIMEOUT_MS: Joi.number().default(30000),

  // ─── Evolution API ────────────────────────────────────────────────────────────
  // Optional in development — required in production for WhatsApp to function
  EVOLUTION_API_BASE_URL: Joi.string().uri().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('http://localhost:8888'),
  }),
  EVOLUTION_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-placeholder-key'),
  }),
  EVOLUTION_WEBHOOK_SECRET: Joi.string().min(16).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-placeholder-secret-32chars'),
  }),
});
