import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminWalletLedgerController } from './admin-wallet-ledger.controller';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [WalletController, AdminWalletLedgerController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
