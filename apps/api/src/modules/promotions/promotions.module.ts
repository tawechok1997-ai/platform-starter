import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { PromotionDomainRepository } from './promotion-domain.repository';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionDomainRepository],
})
export class PromotionsModule {}
