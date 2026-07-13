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

@Controller('member/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly antiBot: AntiBotService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    await this.antiBot.assertValid('MEMBER_REGISTER', dto.captchaToken, req.ip);
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
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateMemberProfileDto) {
    return this.authService.updateMemberProfile(user.id ?? user.sub, dto);
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
