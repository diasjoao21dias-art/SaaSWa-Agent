import { registerAs } from '@nestjs/config';

export default registerAs('evolution', () => ({
  baseUrl: process.env['EVOLUTION_API_BASE_URL'],
  apiKey: process.env['EVOLUTION_API_KEY'],
  webhookSecret: process.env['EVOLUTION_WEBHOOK_SECRET'],
}));
