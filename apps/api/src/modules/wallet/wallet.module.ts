import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminWalletLedgerController } from './admin-wallet-ledger.controller';
import { AdminWalletLedgerQueryService } from './admin-wallet-ledger-query.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [WalletController, AdminWalletLedgerController],
  providers: [WalletService, AdminWalletLedgerQueryService],
  exports: [WalletService],
})
export class WalletModule {}
