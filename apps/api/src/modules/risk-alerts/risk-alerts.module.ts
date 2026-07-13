import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { RiskAlertsController } from './risk-alerts.controller';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskWatchlistController } from './risk-watchlist.controller';
import { RiskWatchlistService } from './risk-watchlist.service';
import { RiskEnforcementService } from './risk-enforcement.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [RiskAlertsController, RiskWatchlistController],
  providers: [RiskAlertsService, RiskWatchlistService, RiskEnforcementService],
  exports: [RiskAlertsService, RiskWatchlistService, RiskEnforcementService],
})
export class RiskAlertsModule {}
