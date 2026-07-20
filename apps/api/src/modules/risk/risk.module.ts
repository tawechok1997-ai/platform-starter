import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RiskSummaryQueryService } from './risk-summary-query.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [RiskController],
  providers: [RiskService, RiskSummaryQueryService],
  exports: [RiskService, RiskSummaryQueryService],
})
export class RiskModule {}
