import { Module } from '@nestjs/common';
import { DashboardCompatController } from './dashboard-compat.controller';
import { DashboardCompatService } from './dashboard-compat.service';
import { StripeService } from './stripe.service';
import { EventsGateway } from './events.gateway';
import { EvolutionApiModule } from '../../evolution/evolution-api.module';

@Module({
  imports: [EvolutionApiModule],
  controllers: [DashboardCompatController],
  providers: [DashboardCompatService, StripeService, EventsGateway],
  exports: [StripeService, EventsGateway],
})
export class DashboardCompatModule {}
