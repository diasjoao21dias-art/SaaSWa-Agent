-- =============================================================================
-- init.sql — Inicialização do PostgreSQL
--
-- Este script roda uma vez na primeira criação do container postgres.
-- Habilita as extensões exigidas pelo schema Prisma.
-- =============================================================================

-- Extensão para UUIDs automáticos (uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão de criptografia (bcrypt, hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Extensão de busca vetorial para embeddings de IA (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
