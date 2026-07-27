// ─── Request metadata keys ────────────────────────────────────────────────────
export const REQUEST_ID_KEY = 'requestId';
export const CURRENT_USER_KEY = 'currentUser';
export const CURRENT_TENANT_KEY = 'currentTenant';

// ─── Decorator metadata keys ──────────────────────────────────────────────────
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const SKIP_TENANT_GUARD_KEY = 'skipTenantGuard';

// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────
export const CACHE_TTL_SHORT = 60;          // 1 minute
export const CACHE_TTL_MEDIUM = 300;        // 5 minutes
export const CACHE_TTL_LONG = 3600;         // 1 hour
export const CACHE_TTL_DAY = 86400;         // 24 hours

// ─── Cache key prefixes ────────────────────────────────────────────────────────
export const CACHE_KEY_REFRESH_TOKEN = 'refresh:';
export const CACHE_KEY_TENANT = 'tenant:';
export const CACHE_KEY_USER = 'user:';
export const CACHE_KEY_AGENT = 'agent:';
export const CACHE_KEY_RATE_LIMIT = 'rate:';
export const CACHE_KEY_CONVERSATION = 'conv:';

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Queue names ──────────────────────────────────────────────────────────────
export const QUEUE_AI_RESPONSE = 'ai-response';
export const QUEUE_WHATSAPP_OUTBOUND = 'whatsapp-outbound';
export const QUEUE_WEBHOOK_INBOUND = 'webhook-inbound';

// ─── User roles ───────────────────────────────────────────────────────────────
export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}
