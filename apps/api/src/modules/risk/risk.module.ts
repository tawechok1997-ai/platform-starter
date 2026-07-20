import { Module } from '@nestjs/common';
import { RiskAlertsModule } from '../risk-alerts/risk-alerts.module';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';

@Module({
  imports: [RiskAlertsModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
