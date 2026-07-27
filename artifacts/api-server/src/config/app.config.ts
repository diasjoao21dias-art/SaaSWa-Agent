import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  globalPrefix: process.env['APP_GLOBAL_PREFIX'] ?? 'api',
  allowedOrigins: process.env['APP_ALLOWED_ORIGINS'] ?? '*',
  /**
   * URL pública desta API — usada para construir a URL de webhook registrada
   * no Evolution API. Ex: https://meuapp.replit.app
   * Se não definida, o webhook não será auto-configurado (requer configuração manual).
   */
  publicUrl: process.env['APP_PUBLIC_URL'] ?? '',
}));
