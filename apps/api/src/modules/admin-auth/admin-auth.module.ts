import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AntiBotModule } from '../anti-bot/anti-bot.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDefenseService } from './admin-login-defense.service';
import { AdminLoginService } from './admin-login.service';
import { AdminRefreshSessionService } from './admin-refresh-session.service';
import { AdminSessionCommandService } from './admin-session-command.service';
import { AdminSessionTokenService } from './admin-session-token.service';
import { AdminSessionsQueryService } from './admin-sessions-query.service';
import { AdminStepUpService } from './admin-step-up.service';
import { AdminTwoFactorCommandService } from './admin-two-factor-command.service';

@Module({
  imports: [JwtModule.register({}), AntiBotModule],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminLoginDefenseService,
    AdminLoginService,
    AdminSessionsQueryService,
    AdminSessionCommandService,
    AdminSessionTokenService,
    AdminRefreshSessionService,
    AdminStepUpService,
    AdminTwoFactorCommandService,
  ],
  exports: [AdminAuthService, AdminLoginService, AdminStepUpService],
})
export class AdminAuthModule {}
