import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdapterTestController } from './adapter-test.controller';
import { AdapterTestService } from './adapter-test.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GamePlatformController } from './game-platform.controller';
import { AdminGameMoneyController, MemberGameTransferController, ProviderWebhookController } from './game-platform-money.controller';
import { GamePlatformMoneyService } from './game-platform-money.service';
import { GamePlatformMonitoringService } from './game-platform-monitoring.service';
import { GamePlatformService } from './game-platform.service';
import { GameRoundDiagnosticsController } from './game-round-diagnostics.controller';
import { GameRoundDiagnosticsRepository } from './game-round-diagnostics.repository';
import { GameRoundDiagnosticsService } from './game-round-diagnostics.service';
import { GameRoundPersistenceService } from './game-round-persistence.service';
import { GameSessionLifecycleService } from './game-session-lifecycle.service';
import { GameSessionTokenService } from './game-session-token.service';
import { GameTransferActionController } from './game-transfer-action.controller';
import { GameTransferActionService } from './game-transfer-action.service';
import { MemberGameCatalogService } from './member-game-catalog.service';
import { MemberGamePlatformController } from './member-game-platform.controller';
import { MemberGameSessionController } from './member-game-session.controller';
import { ProviderPresetController } from './provider-preset.controller';
import { ProviderPresetService } from './provider-preset.service';
import { ProviderReconciliationAlertService } from './provider-reconciliation-alert.service';
import { ProviderReconciliationCommandService } from './provider-reconciliation-command.service';
import { ProviderReconciliationQueryService } from './provider-reconciliation-query.service';
import { ProviderTransferCommandService } from './provider-transfer-command.service';
import { ProviderWebhookService } from './provider-webhook.service';
import { WalletLedgerReconciliationController } from './wallet-ledger-reconciliation.controller';
import { WalletLedgerReconciliationService } from './wallet-ledger-reconciliation.service';
import { WalletMutationService } from './wallet-mutation.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [GamePlatformController, MemberGamePlatformController, MemberGameSessionController, MemberGameTransferController, AdminGameMoneyController, ProviderWebhookController, ProviderPresetController, AdapterTestController, GameTransferActionController, GameRoundDiagnosticsController, WalletLedgerReconciliationController],
  providers: [GamePlatformService, MemberGameCatalogService, GamePlatformMoneyService, GamePlatformMonitoringService, GameRoundPersistenceService, GameRoundDiagnosticsRepository, GameRoundDiagnosticsService, GameSessionTokenService, GameSessionLifecycleService, WalletLedgerReconciliationService, ProviderWebhookService, ProviderTransferCommandService, WalletMutationService, ProviderReconciliationQueryService, ProviderReconciliationCommandService, ProviderReconciliationAlertService, ProviderPresetService, AdapterTestService, GameTransferActionService, ProviderAdapterRegistry],
  exports: [GamePlatformService, MemberGameCatalogService, GamePlatformMoneyService, GamePlatformMonitoringService, GameRoundPersistenceService, GameRoundDiagnosticsService, GameSessionTokenService, GameSessionLifecycleService, WalletLedgerReconciliationService, ProviderWebhookService, ProviderTransferCommandService, WalletMutationService, ProviderReconciliationQueryService, ProviderReconciliationCommandService, ProviderReconciliationAlertService, ProviderPresetService, AdapterTestService, GameTransferActionService, ProviderAdapterRegistry],
})
export class GamePlatformModule {}
