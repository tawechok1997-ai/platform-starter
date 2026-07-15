import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AuthModule } from './modules/auth/auth.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TopUpsModule } from './modules/topups/topups.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportsModule } from './modules/exports/exports.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { RiskAlertsModule } from './modules/risk-alerts/risk-alerts.module';
import { AdminAccessModule } from './modules/admin-access/admin-access.module';
import { AdminAuditModule } from './modules/admin-audit/admin-audit.module';
import { AdminActivityModule } from './modules/admin-activity/admin-activity.module';
import { GamePlatformModule } from './modules/game-platform/game-platform.module';
import { MoneyOpsModule } from './modules/money-ops/money-ops.module';
import { SupportModule } from './modules/support/support.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { AntiBotModule } from './modules/anti-bot/anti-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminAuthModule,
    AntiBotModule,
    SettingsModule,
    WalletModule,
    TopUpsModule,
    WithdrawalsModule,
    FinanceModule,
    ReportsModule,
    ExportsModule,
    BankAccountsModule,
    RiskAlertsModule,
    AdminAccessModule,
    AdminAuditModule,
    AdminActivityModule,
    GamePlatformModule,
    MoneyOpsModule,
    SupportModule,
    PromotionsModule,
    AffiliatesModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
