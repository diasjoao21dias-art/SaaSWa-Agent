import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PromptsRepository } from './prompts.repository';

@Module({
  controllers: [PromptsController],
  providers: [PromptsService, PromptsRepository],
  exports: [PromptsService],
})
export class PromptsModule {}
