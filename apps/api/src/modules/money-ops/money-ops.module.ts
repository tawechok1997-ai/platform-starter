import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ProviderSimulatorEnabledGuard } from '../../common/guards/provider-simulator-enabled.guard';
import { WalletModule } from '../wallet/wallet.module';
import { MoneyOpsController } from './money-ops.controller';
import { MoneyOpsService } from './money-ops.service';
import { ProviderSimulatorAdminController } from './provider-simulator-admin.controller';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { ReconciliationDetailController } from './reconciliation-detail.controller';
import { ReconciliationDetailService } from './reconciliation-detail.service';
import { WalletLedgerDetailController } from './wallet-ledger-detail.controller';
import { WalletLedgerDetailService } from './wallet-ledger-detail.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule, WalletModule],
  controllers: [MoneyOpsController, ProviderSimulatorController, ProviderSimulatorAdminController, ReconciliationDetailController, WalletLedgerDetailController],
  providers: [MoneyOpsService, ReconciliationDetailService, WalletLedgerDetailService, ProviderSimulatorEnabledGuard],
})
export class MoneyOpsModule {}
