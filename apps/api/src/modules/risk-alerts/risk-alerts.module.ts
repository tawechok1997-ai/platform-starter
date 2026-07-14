import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { AdminKycController } from './admin-kyc.controller';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycDocumentsService } from './kyc-documents.service';
import { MemberKycController } from './member-kyc.controller';
import { RiskAlertsController } from './risk-alerts.controller';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskWatchlistController } from './risk-watchlist.controller';
import { RiskWatchlistQueryService } from './risk-watchlist-query.service';
import { RiskWatchlistService } from './risk-watchlist.service';
import { RiskEnforcementService } from './risk-enforcement.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule],
  controllers: [RiskAlertsController, RiskWatchlistController, AdminKycController, MemberKycController],
  providers: [
    RiskAlertsService,
    RiskWatchlistService,
    RiskWatchlistQueryService,
    RiskEnforcementService,
    KycDocumentsService,
    KycDocumentsQueryService,
  ],
  exports: [
    RiskAlertsService,
    RiskWatchlistService,
    RiskWatchlistQueryService,
    RiskEnforcementService,
    KycDocumentsService,
    KycDocumentsQueryService,
  ],
})
export class RiskAlertsModule {}
