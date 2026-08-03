import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { MemberProviderSimulatorController } from './member-provider-simulator.controller';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { ProviderSimulatorManualReviewService } from './provider-simulator-manual-review.service';
import { ProviderSimulatorPersistenceRepository } from './provider-simulator-persistence.repository';
import { ProviderSimulatorRoundService } from './provider-simulator-round.service';
import { ProviderSimulatorSecurityService } from './provider-simulator-security.service';
import { ProviderSimulatorService } from './provider-simulator.service';
import { ProviderSimulatorSlotService } from './provider-simulator-slot.service';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule, WalletModule],
  controllers: [ProviderSimulatorController, MemberProviderSimulatorController],
  providers: [
    ProviderSimulatorService,
    ProviderSimulatorRoundService,
    ProviderSimulatorTransactionService,
    ProviderSimulatorPersistenceRepository,
    ProviderSimulatorSecurityService,
    ProviderSimulatorManualReviewService,
    ProviderSimulatorSlotService,
  ],
  exports: [ProviderSimulatorService],
})
export class ProviderSimulatorModule {}
