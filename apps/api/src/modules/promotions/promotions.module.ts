import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { BonusLifecycleCommandService } from './bonus-lifecycle-command.service';
import { PromotionClaimCommandService } from './promotion-claim-command.service';
import { PromotionDomainRepository } from './promotion-domain.repository';
import { PromotionSettlementRepository } from './promotion-settlement.repository';
import { PromotionsController } from './promotions.controller';
import { PromotionsQueryService } from './promotions-query.service';
import { PromotionsService } from './promotions.service';
import { SettlementCommandService } from './settlement-command.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    PromotionsQueryService,
    PromotionClaimCommandService,
    BonusLifecycleCommandService,
    SettlementCommandService,
    PromotionDomainRepository,
    PromotionSettlementRepository,
  ],
  exports: [
    PromotionsQueryService,
    PromotionClaimCommandService,
    BonusLifecycleCommandService,
    SettlementCommandService,
  ],
})
export class PromotionsModule {}
