import { Module } from '@nestjs/common';
import { DashboardCompatController } from './dashboard-compat.controller';
import { DashboardCompatService } from './dashboard-compat.service';

@Module({
  controllers: [DashboardCompatController],
  providers: [DashboardCompatService],
})
export class DashboardCompatModule {}
