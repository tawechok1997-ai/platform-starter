import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { BonusLifecycleCommandService } from './bonus-lifecycle-command.service';
import { PromotionClaimCommandService } from './promotion-claim-command.service';
import { PromotionDomainRepository } from './promotion-domain.repository';
import { PromotionsController } from './promotions.controller';
import { PromotionsQueryService } from './promotions-query.service';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    PromotionsQueryService,
    PromotionClaimCommandService,
    BonusLifecycleCommandService,
    PromotionDomainRepository,
  ],
  exports: [PromotionsQueryService, PromotionClaimCommandService, BonusLifecycleCommandService],
})
export class PromotionsModule {}
