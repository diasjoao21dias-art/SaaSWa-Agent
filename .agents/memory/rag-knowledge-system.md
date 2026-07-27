---
name: RAG Knowledge System
description: Architecture and key decisions for the knowledge base + RAG pipeline implemented in KnowledgeModule
---

## Architecture

Ingestion: REST API → DocumentIngestionService → BullMQ (knowledge-processing queue) → DocumentProcessingConsumer → TextExtractor → Chunker → EmbeddingService → VectorSearchService.saveEmbedding()

Retrieval (RAG): AiResponseConsumer passes agent.knowledgeBaseId → AiService.generate() → VectorSearchService.getKnowledgeContext() → PromptBuilderService injects knowledge section.

## Key decisions

**Why pgvector over JSONB:** cosine similarity in the DB with HNSW index; JSONB would require loading all vectors into JS memory.

**Why @Optional() for VectorSearchService in AiService:** allows AiModule to work without KnowledgeModule in isolated tests, and degrades gracefully if RAG fails.

**Module dependency (no circular):** KnowledgeModule → OpenAiModule; AiModule → KnowledgeModule; QueueModule → AiModule.

**Why one KnowledgeDocument per chunk:** schema was already designed this way (chunkIndex field); chunk 0 updates the original doc, chunks 1..N are new inserts linked via fileId.

**File storage:** LOCAL provider, stored in artifacts/api-server/uploads/knowledge/. storageKey = "knowledge/<uuid><ext>".

## Important rules

- VectorSearchService.search() degrades gracefully on pgvector failure (logs error, returns []).
- RAG failure in AiService is non-fatal (warns, continues without context).
- Embedding field uses Unsupported("vector(1536)") in Prisma — never use Prisma ORM to write this column, use $executeRaw.
- Migration file: prisma/migrations/20250727000001_add_pgvector/migration.sql

## Config needed

- OPENAI_API_KEY for embeddings (text-embedding-3-small)
- PostgreSQL with pgvector extension installed
- Migration must be run: prisma migrate deploy
