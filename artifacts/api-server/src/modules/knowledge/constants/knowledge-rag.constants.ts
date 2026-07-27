// =============================================================================
// RAG — Constantes do Sistema de Conhecimento
// =============================================================================

// ─── Queue / Job ──────────────────────────────────────────────────────────────
export const QUEUE_KNOWLEDGE_PROCESSING = 'knowledge-processing';
export const JOB_PROCESS_DOCUMENT       = 'process-document';

// ─── Embedding ────────────────────────────────────────────────────────────────
/** Dimensões do modelo text-embedding-3-small */
export const EMBEDDING_DIMENSIONS = 1536;

/** Tamanho máximo de lote para chamadas à OpenAI Embeddings API */
export const EMBEDDING_BATCH_SIZE = 20;

// ─── Chunking ────────────────────────────────────────────────────────────────
/** Tamanho alvo de cada chunk em caracteres */
export const CHUNK_SIZE = 1000;

/** Sobreposição entre chunks consecutivos (manutenção de contexto) */
export const CHUNK_OVERLAP = 200;

/** Separadores usados pelo splitter recursivo (em ordem de preferência) */
export const CHUNK_SEPARATORS = ['\n\n', '\n', '. ', '? ', '! ', ' ', ''];

// ─── Busca vetorial ───────────────────────────────────────────────────────────
/** Número padrão de chunks retornados por busca (top-K) */
export const SEARCH_TOP_K = 5;

/** Similaridade mínima para incluir um chunk como contexto (0–1) */
export const SEARCH_MIN_SIMILARITY = 0.70;

/** Tamanho máximo do contexto injetado no prompt (caracteres) */
export const CONTEXT_MAX_CHARS = 4000;

// ─── Formatos aceitos ─────────────────────────────────────────────────────────
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // xlsx
  'application/vnd.ms-excel',                                                 // xls
  'text/plain',
  'text/csv',
  'text/html',
  'application/octet-stream', // fallback
] as const;

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Upload ───────────────────────────────────────────────────────────────────
export const UPLOAD_DIR = './uploads/knowledge';
