import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env['OPENAI_API_KEY'],
  organization: process.env['OPENAI_ORGANIZATION'] ?? undefined,
  defaultModel: process.env['OPENAI_DEFAULT_MODEL'] ?? 'gpt-4o-mini',
  timeoutMs: parseInt(process.env['OPENAI_TIMEOUT_MS'] ?? '30000', 10),
}));
