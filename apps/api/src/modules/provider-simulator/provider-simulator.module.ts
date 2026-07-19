import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { ProviderSimulatorService } from './provider-simulator.service';

@Module({
  imports: [WalletModule],
  controllers: [ProviderSimulatorController],
  providers: [ProviderSimulatorService],
  exports: [ProviderSimulatorService],
})
export class ProviderSimulatorModule {}
