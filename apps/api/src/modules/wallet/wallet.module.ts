import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminLedgerMutationService } from './admin-ledger-mutation.service';
import { AdminWalletLedgerController } from './admin-wallet-ledger.controller';
import { AdminWalletLedgerQueryService } from './admin-wallet-ledger-query.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [WalletController, AdminWalletLedgerController],
  providers: [WalletService, AdminLedgerMutationService, AdminWalletLedgerQueryService],
  exports: [WalletService, AdminLedgerMutationService],
})
export class WalletModule {}
