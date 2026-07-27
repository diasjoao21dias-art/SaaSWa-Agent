-- =============================================================================
-- Migration: Add pgvector extension and convert embedding column to vector type
-- =============================================================================

-- Enable the vector extension (requires pgvector installed on the PostgreSQL server)
CREATE EXTENSION IF NOT EXISTS vector;

-- Convert the embedding column from JSONB to vector(1536)
-- text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE "knowledge_documents"
  DROP COLUMN IF EXISTS "embedding";

ALTER TABLE "knowledge_documents"
  ADD COLUMN "embedding" vector(1536);

-- Create an HNSW index for fast approximate nearest-neighbor cosine similarity search
-- HNSW is preferred over IVFFlat for real-time inserts (no training required)
CREATE INDEX IF NOT EXISTS "knowledge_documents_embedding_hnsw_idx"
  ON "knowledge_documents"
  USING hnsw ("embedding" vector_cosine_ops);
