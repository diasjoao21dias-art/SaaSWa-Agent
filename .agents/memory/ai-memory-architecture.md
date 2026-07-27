---
name: AI Memory Architecture
description: Two-layer conversation memory — Redis hot context + PostgreSQL persistent history. Covers design decisions, data flow, and cleanup strategy.
---

# AI Memory Architecture

## Design: Two-Layer Memory

### Layer 1 — Redis (Hot Context)
- Key: `conv:ctx:{conversationId}` (Redis List)
- Operation: LPUSH (newest at head) + LTRIM (cap at windowSize) + EXPIRE (TTL sliding)
- TTL: 7200s (2h), resets on every new message
- When used: AiResponseConsumer reads context on every AI request (< 1ms, zero DB hit)
- Cap: `MEMORY_MAX_WINDOW_SIZE = 100` safety cap even if agent.contextWindowSize is larger

### Layer 2 — PostgreSQL (Persistent History)
- Existing `Message` table — no schema changes needed
- When used: Redis cache miss (cold start, Redis restart, TTL expired) → `ConversationMemoryService.loadFromDatabase()` queries Postgres and warms Redis in background (fire-and-forget)
- Also used for: human agent history review, analytics, audit, cleanup

## Data Flow

```
Message arrives → webhook-inbound consumer:
  1. Save USER message to PostgreSQL
  2. Push USER message to Redis (LPUSH + LTRIM + EXPIRE)
  3. Enqueue ai-response job

ai-response consumer:
  1. getContext() → try Redis → if miss: query Postgres + warm Redis async
  2. Generate AI response
  3. Save ASSISTANT message to PostgreSQL
  4. Push ASSISTANT message to Redis
  5. Enqueue outbound WhatsApp send
```

## Auto-Cleanup Strategy

BullMQ repeatable cron job (`memory-cleanup` queue) running daily at 02:00:
- Soft-deletes messages older than 90 days (`MEMORY_RETENTION_DAYS`)
- Only for conversations CLOSED > 30 days ago (`MEMORY_CLOSE_GRACE_DAYS`)
- Processes in batches of 500 rows (cursor pagination, no large IN locks)
- Redis: no cleanup needed — TTL expires automatically after 2h inactivity

**Why:** Closed conversations accumulate messages never used by AI model → PostgreSQL grows unbounded → slow history queries. Redis self-cleans via TTL.

## Key files

- `src/memory/conversation-memory.service.ts` — core: push, getContext (with fallback), evict
- `src/memory/memory-cleanup.consumer.ts` — BullMQ cron for Postgres soft-delete
- `src/memory/memory-cleanup.producer.ts` — schedules cron on module init (idempotent)
- `src/memory/memory.module.ts` — NestJS module, imported by QueueModule and AppModule
- `src/cache/cache.service.ts` — added lpush, ltrim, lrange, lpushTrimExpire (pipeline)

## Important

- `ConversationMemoryService.pushMessage()` silently swallows Redis failures — Postgres is the truth, Redis is the cache. Never block on Redis errors.
- `getContext()` warms Redis in background (fire-and-forget) to avoid blocking AI response
- `MEMORY_MAX_WINDOW_SIZE=100` is the Redis cap; agent.contextWindowSize controls how many messages are actually sliced for the prompt (can be < 100)

**Why:** Redis failures must not break AI responses; Postgres always has the truth.
