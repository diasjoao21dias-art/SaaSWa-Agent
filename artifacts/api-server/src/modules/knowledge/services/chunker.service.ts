// =============================================================================
// ChunkerService — Divisão de texto em chunks com sobreposição
//
// Implementa Recursive Character Text Splitting — o mesmo algoritmo usado
// pelo LangChain, reconhecido como padrão para RAG.
//
// Lógica:
//   1. Tenta dividir pelo separador de maior granularidade (\n\n)
//   2. Se os fragmentos ainda forem maiores que chunkSize, tenta o próximo
//   3. Mescla fragmentos pequenos até atingir chunkSize (com overlap)
// =============================================================================

import { Injectable } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP, CHUNK_SEPARATORS } from '../constants/knowledge-rag.constants';

export interface TextChunk {
  /** Texto do chunk */
  content: string;
  /** Posição do chunk no documento original (0-based) */
  index: number;
  /** Estimativa de tokens (chars ÷ 4) */
  tokenCount: number;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  separators?: string[];
}

@Injectable()
export class ChunkerService {
  /**
   * Divide um texto em chunks com sobreposição.
   *
   * @param text     Texto limpo extraído do documento
   * @param options  Parâmetros opcionais (sobrescreve defaults)
   * @returns        Array de chunks ordenados por índice
   */
  chunk(text: string, options: ChunkOptions = {}): TextChunk[] {
    const chunkSize  = options.chunkSize  ?? CHUNK_SIZE;
    const overlap    = options.overlap    ?? CHUNK_OVERLAP;
    const separators = options.separators ?? CHUNK_SEPARATORS;

    if (!text || text.trim().length === 0) return [];

    const rawChunks = this.splitRecursively(text.trim(), separators, chunkSize);
    const merged    = this.mergeWithOverlap(rawChunks, chunkSize, overlap);

    return merged.map((content, index) => ({
      content: content.trim(),
      index,
      tokenCount: Math.ceil(content.length / 4),
    })).filter((c) => c.content.length > 0);
  }

  // ─── Privados ──────────────────────────────────────────────────────────────

  /**
   * Divide recursivamente usando a lista de separadores.
   */
  private splitRecursively(
    text: string,
    separators: string[],
    chunkSize: number,
  ): string[] {
    if (!separators.length || text.length <= chunkSize) {
      return [text];
    }

    const [sep, ...rest] = separators;

    // Separador vazio = dividir caractere a caractere (último recurso)
    const parts = sep === ''
      ? text.split('')
      : text.split(sep!);

    const result: string[] = [];

    for (const part of parts) {
      const p = sep === '' ? part : part; // mantém o separador no texto original
      if (p.length <= chunkSize) {
        result.push(p);
      } else {
        // Parte ainda maior que chunkSize → divide recursivamente
        const sub = this.splitRecursively(p, rest, chunkSize);
        result.push(...sub);
      }
    }

    // Reinsere o separador entre os fragmentos (exceto o último)
    if (sep !== '') {
      const rejoined: string[] = [];
      for (let i = 0; i < result.length; i++) {
        rejoined.push(i < result.length - 1 ? result[i]! + sep : result[i]!);
      }
      return rejoined;
    }

    return result;
  }

  /**
   * Mescla fragmentos pequenos em chunks do tamanho alvo e adiciona overlap.
   */
  private mergeWithOverlap(
    parts: string[],
    chunkSize: number,
    overlap: number,
  ): string[] {
    const chunks: string[] = [];
    let current = '';

    for (const part of parts) {
      if (current.length + part.length > chunkSize && current.length > 0) {
        chunks.push(current);

        // Overlap: mantém o final do chunk atual no início do próximo
        const overlapText = current.slice(-overlap);
        current = overlapText + part;
      } else {
        current += part;
      }
    }

    if (current.trim().length > 0) {
      chunks.push(current);
    }

    return chunks;
  }
}
