import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { ProviderSimulatorManualReviewService } from './provider-simulator-manual-review.service';
import { ProviderSimulatorRoundService } from './provider-simulator-round.service';
import { ProviderSimulatorSecurityService } from './provider-simulator-security.service';
import { ProviderSimulatorService } from './provider-simulator.service';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

@Module({
  imports: [WalletModule],
  controllers: [ProviderSimulatorController],
  providers: [
    ProviderSimulatorService,
    ProviderSimulatorRoundService,
    ProviderSimulatorTransactionService,
    ProviderSimulatorSecurityService,
    ProviderSimulatorManualReviewService,
  ],
  exports: [ProviderSimulatorService],
})
export class ProviderSimulatorModule {}
