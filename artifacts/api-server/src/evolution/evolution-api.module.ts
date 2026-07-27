import { Module } from '@nestjs/common';
import { EvolutionApiService } from './evolution-api.service';

/**
 * EvolutionModule — camada de infraestrutura pura.
 *
 * Exporta apenas o EvolutionApiService, que é responsável por toda
 * comunicação HTTP com o Evolution API Gateway.
 *
 * Importe este módulo em qualquer módulo que precise fazer chamadas
 * para o Evolution API (WhatsappModule, QueueModule, etc.).
 */
@Module({
  providers: [EvolutionApiService],
  exports: [EvolutionApiService],
})
export class EvolutionApiModule {}
