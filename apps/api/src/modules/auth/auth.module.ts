import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { AntiBotModule } from '../anti-bot/anti-bot.module';
import { RiskAlertsModule } from '../risk-alerts/risk-alerts.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MemberRiskEnforcementService } from './member-risk-enforcement.service';
import { PhoneOtpService } from './phone-otp.service';
import { SmsProviderService } from './sms-provider.service';

@Module({
  imports: [JwtAuthModule, AntiBotModule, RiskAlertsModule],
  controllers: [AuthController],
  providers: [AuthService, MemberRiskEnforcementService, PhoneOtpService, SmsProviderService],
  exports: [AuthService, PhoneOtpService],
})
export class AuthModule {}
