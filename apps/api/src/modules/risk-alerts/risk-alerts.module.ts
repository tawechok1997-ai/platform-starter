import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { AdminKycController } from './admin-kyc.controller';
import { FinanceRiskSummaryQueryService } from './finance-risk-summary-query.service';
import { KycAccessService } from './kyc-access.service';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycDocumentsService } from './kyc-documents.service';
import { KycMemberCommandService } from './kyc-member-command.service';
import { KycRetentionService } from './kyc-retention.service';
import { KycReviewCommandService } from './kyc-review-command.service';
import { MemberKycController } from './member-kyc.controller';
import { RiskAlertsController } from './risk-alerts.controller';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskWatchlistCommandService } from './risk-watchlist-command.service';
import { RiskWatchlistController } from './risk-watchlist.controller';
import { RiskWatchlistQueryService } from './risk-watchlist-query.service';
import { RiskWatchlistService } from './risk-watchlist.service';
import { RiskEnforcementService } from './risk-enforcement.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule, StorageModule],
  controllers: [RiskAlertsController, RiskWatchlistController, AdminKycController, MemberKycController],
  providers: [
    RiskAlertsService,
    FinanceRiskSummaryQueryService,
    RiskWatchlistService,
    RiskWatchlistQueryService,
    RiskWatchlistCommandService,
    RiskEnforcementService,
    KycDocumentsService,
    KycDocumentsQueryService,
    KycMemberCommandService,
    KycReviewCommandService,
    KycAccessService,
    KycRetentionService,
  ],
  exports: [
    RiskAlertsService,
    FinanceRiskSummaryQueryService,
    RiskWatchlistService,
    RiskWatchlistQueryService,
    RiskWatchlistCommandService,
    RiskEnforcementService,
    KycDocumentsService,
    KycDocumentsQueryService,
    KycMemberCommandService,
    KycReviewCommandService,
    KycAccessService,
    KycRetentionService,
  ],
})
export class RiskAlertsModule {}
