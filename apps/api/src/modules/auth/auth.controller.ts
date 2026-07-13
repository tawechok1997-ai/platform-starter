import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { AntiBotService } from '../anti-bot/anti-bot.service';
import { AuthService } from './auth.service';
import { ChangeMemberPasswordDto } from './dto/change-member-password.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { MemberSignInDto } from './dto/member-sign-in.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { RequestPhoneOtpDto, VerifyPhoneOtpDto } from './dto/phone-otp.dto';
import { MemberRiskEnforcementService } from './member-risk-enforcement.service';
import { PhoneOtpService } from './phone-otp.service';

@Controller('member/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly antiBot: AntiBotService,
    private readonly memberRisk: MemberRiskEnforcementService,
    private readonly phoneOtp: PhoneOtpService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    await this.antiBot.assertValid('MEMBER_REGISTER', dto.captchaToken, req.ip);
    await this.memberRisk.enforceRegistration(dto, req.ip, dto.deviceId);
    return this.authService.register(dto, this.meta(req, dto.deviceId));
  }

  @Post('login')
  async signIn(@Body() dto: MemberSignInDto, @Req() req: any) {
    await this.antiBot.assertValid('MEMBER_LOGIN', dto.captchaToken, req.ip);
    return this.authService.signIn(dto, this.meta(req, dto.deviceId));
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: any) {
    await this.antiBot.assertValid('MEMBER_PASSWORD_RESET', dto.captchaToken, req.ip);
    return this.authService.requestPasswordReset(dto.identifier);
  }

  @Post('password-reset/confirm')
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshSessionDto, @Req() req: any) {
    return this.authService.refreshSession(dto, this.meta(req, dto.deviceId));
  }

  @UseGuards(MemberAuthGuard)
  @Post('phone-otp/request')
  requestPhoneOtp(@CurrentUser() user: any, @Body() dto: RequestPhoneOtpDto, @Req() req: any) {
    return this.phoneOtp.request(user.id ?? user.sub, { ipAddress: req.ip, deviceId: dto.deviceId ?? user.deviceId });
  }

  @UseGuards(MemberAuthGuard)
  @Post('phone-otp/verify')
  verifyPhoneOtp(@CurrentUser() user: any, @Body() dto: VerifyPhoneOtpDto) {
    return this.phoneOtp.verify(user.id ?? user.sub, dto.code);
  }

  @UseGuards(MemberAuthGuard)
  @Post('logout')
  signOut(@CurrentUser() user: any) {
    return this.authService.signOut(user.sessionId);
  }

  @UseGuards(MemberAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.authService.getMemberProfile(user.id ?? user.sub);
  }

  @UseGuards(MemberAuthGuard)
  @Patch('profile')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateMemberProfileDto) {
    const memberId = user.id ?? user.sub;
    await this.memberRisk.enforceProfileUpdate(memberId, dto);
    return this.authService.updateMemberProfile(memberId, dto);
  }

  @UseGuards(MemberAuthGuard)
  @Post('password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangeMemberPasswordDto) {
    return this.authService.changeMemberPassword(user.id ?? user.sub, user.sessionId, dto);
  }

  @UseGuards(MemberAuthGuard)
  @Get('sessions')
  listSessions(@CurrentUser() user: any) {
    return this.authService.listMemberSessions(user.id ?? user.sub, user.sessionId);
  }

  @UseGuards(MemberAuthGuard)
  @Delete('sessions/others')
  revokeOtherSessions(@CurrentUser() user: any) {
    return this.authService.revokeOtherMemberSessions(user.id ?? user.sub, user.sessionId);
  }

  @UseGuards(MemberAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    return this.authService.revokeMemberSession(user.id ?? user.sub, user.sessionId, sessionId);
  }

  @UseGuards(MemberAuthGuard)
  @Get('security')
  getSecurity(@CurrentUser() user: any) {
    return this.authService.getMemberSecurity(user.id ?? user.sub);
  }

  private meta(req: any, deviceId?: string) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId,
    };
  }
}
