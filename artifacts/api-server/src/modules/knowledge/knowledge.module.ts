import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';
import { DocumentIngestionService } from './services/document-ingestion.service';
import { DocumentProcessingConsumer } from './consumers/document-processing.consumer';
import { TextExtractorService } from './services/text-extractor.service';
import { ChunkerService } from './services/chunker.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorSearchService } from './services/vector-search.service';
import { OpenAiModule } from '../../openai/openai.module';
import { QUEUE_KNOWLEDGE_PROCESSING } from './constants/knowledge-rag.constants';

/**
 * KnowledgeModule — Sistema completo de Retrieval-Augmented Generation (RAG)
 *
 * Exporta VectorSearchService para uso pelo AiModule (injeção de contexto no prompt).
 *
 * Fluxo:
 *   REST → DocumentIngestionService → BullMQ → DocumentProcessingConsumer
 *        → TextExtractor → Chunker → EmbeddingService → VectorSearchService
 */
@Module({
  imports: [
    // OpenAI infrastructure (embeddings)
    OpenAiModule,
    // BullMQ queue para processamento assíncrono de documentos
    BullModule.registerQueue({ name: QUEUE_KNOWLEDGE_PROCESSING }),
  ],
  controllers: [KnowledgeController],
  providers: [
    // Core
    KnowledgeService,
    KnowledgeRepository,
    // Ingestion pipeline
    DocumentIngestionService,
    TextExtractorService,
    ChunkerService,
    EmbeddingService,
    VectorSearchService,
    // Async worker
    DocumentProcessingConsumer,
  ],
  exports: [
    KnowledgeService,
    VectorSearchService,
    EmbeddingService,
  ],
})
export class KnowledgeModule {}
