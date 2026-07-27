---
name: AI Service Design
description: Architecture and key decisions for the AI generation layer using OpenAI Responses API
---

# AI Service Design

## Rule: Use Responses API, never Chat Completions
All AI generation goes through `OpenAiResponsesService` (`src/openai/openai-responses.service.ts`) which uses `openai.responses.create()`.
Never use `openai.chat.completions.create()` — it is the legacy API.

**Why:** Responses API is OpenAI's current API (2025). Separates `instructions` (system prompt) from `input` (conversation history), uses `max_output_tokens` instead of `max_tokens`, returns `response.output_text` and `response.usage.input_tokens/output_tokens`.

## Layer Map

| Layer | File | Responsibility |
|---|---|---|
| HTTP client | `src/openai/openai-responses.service.ts` | All calls to `openai.responses.create()` |
| Prompt builder | `src/modules/ai/prompt-builder.service.ts` | Assembles system prompt from agent config |
| Business logic | `src/modules/ai/ai.service.ts` | Loads agent, builds context, orchestrates |
| Thin consumer | `src/queue/consumers/ai-response.consumer.ts` | Loads history from DB, calls AiService, saves msg, enqueues outbound |

## Personality = AiAgent.description
There is no separate `personality` DB column. `AiAgent.description` (String? @db.Text) is used as the personality definition.
It feeds the `# Personalidade` section of the assembled system prompt.

## PromptBuilderService — 8 Sections
build(config, context) always produces: Identidade, Personalidade (if set), Instruções (if prompt linked), Estilo (derived from temperature), Contexto Atual (customerName/datetime), Transferência (if handoffEnabled), Fallback (if set), Regras Gerais.

Temperature → Style mapping:
- 0.0–0.3: Formal/technical
- 0.4–0.6: Professional
- 0.7–0.9: Friendly/natural (default)
- 1.0–1.3: Casual/expressive
- 1.4–2.0: Creative

## AgentsRepository — findByIdGlobal
Consumer does not have tenant context. Use `findByIdGlobal(id)` (no tenantId filter).
`findById(id, tenantId)` is for API routes where tenant isolation is required.

## QueueModule imports AiModule
No circular dep: QueueModule → AiModule → AgentsModule (no queue dependency).
