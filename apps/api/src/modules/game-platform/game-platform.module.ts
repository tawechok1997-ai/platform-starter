import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdapterTestController } from './adapter-test.controller';
import { AdapterTestService } from './adapter-test.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GamePlatformController } from './game-platform.controller';
import { AdminGameMoneyController, MemberGameTransferController, ProviderWebhookController } from './game-platform-money.controller';
import { GamePlatformMoneyService } from './game-platform-money.service';
import { GamePlatformService } from './game-platform.service';
import { GameTransferActionController } from './game-transfer-action.controller';
import { GameTransferActionService } from './game-transfer-action.service';
import { MemberGamePlatformController } from './member-game-platform.controller';
import { ProviderPresetController } from './provider-preset.controller';
import { ProviderPresetService } from './provider-preset.service';
import { ProviderReconciliationAlertService } from './provider-reconciliation-alert.service';
import { ProviderReconciliationCommandService } from './provider-reconciliation-command.service';
import { ProviderReconciliationQueryService } from './provider-reconciliation-query.service';
import { ProviderTransferCommandService } from './provider-transfer-command.service';
import { ProviderWebhookService } from './provider-webhook.service';
import { WalletMutationService } from './wallet-mutation.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [GamePlatformController, MemberGamePlatformController, MemberGameTransferController, AdminGameMoneyController, ProviderWebhookController, ProviderPresetController, AdapterTestController, GameTransferActionController],
  providers: [GamePlatformService, GamePlatformMoneyService, ProviderWebhookService, ProviderTransferCommandService, WalletMutationService, ProviderReconciliationQueryService, ProviderReconciliationCommandService, ProviderReconciliationAlertService, ProviderPresetService, AdapterTestService, GameTransferActionService, ProviderAdapterRegistry],
  exports: [GamePlatformService, GamePlatformMoneyService, ProviderWebhookService, ProviderTransferCommandService, WalletMutationService, ProviderReconciliationQueryService, ProviderReconciliationCommandService, ProviderReconciliationAlertService, ProviderPresetService, AdapterTestService, GameTransferActionService, ProviderAdapterRegistry],
})
export class GamePlatformModule {}
