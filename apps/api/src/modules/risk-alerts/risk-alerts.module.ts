import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { RiskAlertsController } from './risk-alerts.controller';
import { RiskAlertsService } from './risk-alerts.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [RiskAlertsController],
  providers: [RiskAlertsService],
  exports: [RiskAlertsService],
})
export class RiskAlertsModule {}
