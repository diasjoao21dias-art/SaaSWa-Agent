import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappRepository } from './whatsapp.repository';
import { EvolutionApiModule } from '../../evolution/evolution-api.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [
    EvolutionApiModule,   // EvolutionApiService (HTTP para Evolution API)
    QueueModule,          // WhatsappOutboundProducer (BullMQ)
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappRepository],
  exports: [WhatsappService, WhatsappRepository],
})
export class WhatsappModule {}
