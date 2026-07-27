---
name: Evolution API Integration
description: Architecture and key decisions for the WhatsApp / Evolution API integration layer
---

# Evolution API Integration

## Rule
`EvolutionApiService` (`src/evolution/evolution-api.service.ts`) is pure HTTP infrastructure — no Prisma, no business logic, no tenant concepts. All other layers must go through it; never use raw axios for Evolution API calls.

**Why:** Keeps HTTP contract isolated. Any Evolution API endpoint change requires only editing one file.

## How to apply
- New Evolution API feature → add method to `EvolutionApiService`, then call from `WhatsappService` or a consumer.
- Never call `axios` for Evolution API outside `EvolutionApiService`.

---

## Layer Map

| Layer | File | Responsibility |
|---|---|---|
| HTTP client | `src/evolution/evolution-api.service.ts` | All Evolution API HTTP calls |
| Business logic | `src/modules/whatsapp/whatsapp.service.ts` | Tenant isolation, state validation, orchestration |
| Queue producer | `src/queue/producers/whatsapp-outbound.producer.ts` | Enqueue send jobs + reconnect jobs |
| Send consumer | `src/queue/consumers/whatsapp-outbound.consumer.ts` | Execute sends (all types) + auto-reconnect |
| Inbound consumer | `src/queue/consumers/webhook-inbound.consumer.ts` | Handle all Evolution webhook events |

---

## Auto-Reconnect Strategy
- `WebhookInboundConsumer.handleConnectionUpdate()` detects `state=close`
- Schedules `JOB_RECONNECT_WHATSAPP_INSTANCE` with 15s initial delay, 8 attempts, exponential backoff
- Job uses `jobId: reconnect:{instanceName}` to prevent duplicate reconnect jobs
- Does NOT reconnect for statusReason 401, 403, 515 (session expired / unauthorized)
- Reconnect calls `evolution.restartInstance()` → Evolution tries to restore Baileys session
- Status set to INITIALIZING; final status (CONNECTED or QR_CODE) arrives via webhook

## Message Types Supported (outbound)
text, image, audio (PTT voice note), video, document, location

## Webhook Events Handled (inbound)
- `messages.upsert` — all media types; skips `fromMe=true` and group messages
- `messages.update` — maps Evolution statuses (SERVER_ACK→SENT, DELIVERY_ACK→DELIVERED, READ/PLAYED→READ)
- `connection.update` — updates DB status, triggers auto-reconnect
- `qrcode.updated` — saves base64 QR with 60s TTL

## Key Schema Notes
- `Message.mediaUrl` does not exist in Prisma schema — store media URLs in `Message.metadata.mediaUrl`
- `PrismaModule` is `@Global()` — no need to import it in feature modules
- `WhatsappNumber.sessionData` (JSONB) stores last disconnect reason/timestamp for diagnostics

## APP_PUBLIC_URL
Required env var to auto-configure Evolution webhook URL on instance creation.
If not set, webhook must be configured manually via Evolution API dashboard.
