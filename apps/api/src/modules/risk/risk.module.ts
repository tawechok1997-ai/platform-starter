import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RiskSummaryQueryService } from './risk-summary-query.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [RiskController],
  providers: [RiskService, RiskSummaryQueryService],
  exports: [RiskService, RiskSummaryQueryService],
})
export class RiskModule {}
