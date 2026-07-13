import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AntiBotService } from '../anti-bot/anti-bot.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDefenseService } from './admin-login-defense.service';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly antiBot: AntiBotService,
    private readonly loginDefense: AdminLoginDefenseService,
  ) {}

  @Post('login')
  async signIn(@Body() dto: AdminSignInDto, @Req() req: any) {
    const meta = this.meta(req, dto.deviceId);
    await this.loginDefense.assertAllowed(dto.username, meta);
    await this.antiBot.assertValid('ADMIN_LOGIN', dto.captchaToken, meta.ipAddress);
    return this.adminAuthService.signIn(dto, meta);
  }

  @Post('2fa/verify')
  verifyTwoFactor(@Body() dto: VerifyAdminTwoFactorDto, @Req() req: any) {
    return this.adminAuthService.verifyTwoFactor(dto, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.setupTwoFactor(user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/enable')
  enableTwoFactor(@CurrentUser() user: any, @Body('code') code: string, @Req() req: any) {
    return this.adminAuthService.enableTwoFactor(user.id, code, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/disable')
  disableTwoFactor(@CurrentUser() user: any, @Body('code') code: string, @Req() req: any) {
    return this.adminAuthService.disableTwoFactor(user.id, code, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/recovery-codes/regenerate')
  regenerateRecoveryCodes(@CurrentUser() user: any, @Body('code') code: string, @Req() req: any) {
    return this.adminAuthService.regenerateRecoveryCodes(user.id, code, this.meta(req));
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    return this.adminAuthService.refreshSession(refreshToken, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  signOut(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.signOut(user.sessionId, user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: any) {
    return this.adminAuthService.listSessions(user.id, user.sessionId);
  }

  @UseGuards(AdminAuthGuard)
  @Post('sessions/logout-others')
  logoutOtherSessions(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.revokeOtherSessions(user.id, user.sessionId, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('sessions/logout-all')
  logoutAllSessions(@CurrentUser() user: any, @Req() req: any) {
    return this.adminAuthService.revokeAllSessions(user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string, @Req() req: any) {
    return this.adminAuthService.revokeSession(user.id, user.sessionId, sessionId, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }

  private meta(req: any, deviceId?: string) {
    return {
      ipAddress: this.clientIp(req),
      userAgent: req.headers['user-agent'],
      deviceId,
    };
  }

  private clientIp(req: any) {
    // Express resolves req.ip using the configured trusted proxy hop count.
    // Never parse x-forwarded-for directly here because clients can spoof it.
    return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
  }
}
