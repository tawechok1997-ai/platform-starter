import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor, HttpRequestContext } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AntiBotService } from '../anti-bot/anti-bot.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDefenseService } from './admin-login-defense.service';
import { AdminRefreshSessionDto, AdminTwoFactorCodeDto } from './dto/admin-auth-actions.dto';
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
  async signIn(@Body() dto: AdminSignInDto, @Req() req: HttpRequestContext, @Res({ passthrough: true }) res: any) {
    const meta = this.meta(req, dto.deviceId);
    await this.loginDefense.assertAllowed(dto.username, meta);
    await this.antiBot.assertValid('ADMIN_LOGIN', dto.captchaToken, meta.ipAddress);
    const result = await this.adminAuthService.signIn(dto, meta);
    this.setRefreshCookie(res, this.sessionRefreshToken(result));
    return result;
  }

  @Post('2fa/verify')
  async verifyTwoFactor(@Body() dto: VerifyAdminTwoFactorDto, @Req() req: HttpRequestContext, @Res({ passthrough: true }) res: any) {
    const result = await this.adminAuthService.verifyTwoFactor(dto, this.meta(req));
    this.setRefreshCookie(res, result?.refreshToken);
    return result;
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) {
    return this.adminAuthService.setupTwoFactor(user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/enable')
  enableTwoFactor(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: AdminTwoFactorCodeDto, @Req() req: AdminRequestContext) {
    return this.adminAuthService.enableTwoFactor(user.id, body.code, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/disable')
  disableTwoFactor(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: AdminTwoFactorCodeDto, @Req() req: AdminRequestContext) {
    return this.adminAuthService.disableTwoFactor(user.id, body.code, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('2fa/recovery-codes/regenerate')
  regenerateRecoveryCodes(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: AdminTwoFactorCodeDto, @Req() req: AdminRequestContext) {
    return this.adminAuthService.regenerateRecoveryCodes(user.id, body.code, this.meta(req));
  }

  @Post('refresh')
  async refresh(@Body() body: AdminRefreshSessionDto, @Req() req: HttpRequestContext, @Res({ passthrough: true }) res: any) {
    const token = String(body.refreshToken ?? '').trim() || this.readRefreshCookie(req);
    const result = await this.adminAuthService.refreshSession(token, this.meta(req));
    this.setRefreshCookie(res, result?.refreshToken);
    return result;
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  signOut(@CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext, @Res({ passthrough: true }) res: any) {
    this.clearRefreshCookie(res);
    return this.adminAuthService.signOut(user.sessionId, user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: AuthenticatedAdminActor) {
    return this.adminAuthService.listSessions(user.id, user.sessionId);
  }

  @UseGuards(AdminAuthGuard)
  @Post('sessions/logout-others')
  logoutOtherSessions(@CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) {
    return this.adminAuthService.revokeOtherSessions(user.id, user.sessionId, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('sessions/logout-all')
  logoutAllSessions(@CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) {
    return this.adminAuthService.revokeAllSessions(user.id, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(@CurrentUser() user: AuthenticatedAdminActor, @Param('sessionId') sessionId: string, @Req() req: AdminRequestContext) {
    return this.adminAuthService.revokeSession(user.id, user.sessionId, sessionId, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedAdminActor) {
    return user;
  }

  private sessionRefreshToken(result: any) {
    return typeof result?.refreshToken === 'string' ? result.refreshToken : undefined;
  }

  private setRefreshCookie(res: any, refreshToken?: string) {
    if (!refreshToken || typeof res?.setHeader !== 'function') return;
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `platform_admin_refresh=${encodeURIComponent(refreshToken)}; Path=/api/admin/auth; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
  }

  private clearRefreshCookie(res: any) {
    if (typeof res?.setHeader !== 'function') return;
    res.setHeader('Set-Cookie', 'platform_admin_refresh=; Path=/api/admin/auth; HttpOnly; SameSite=Lax; Max-Age=0');
  }

  private readRefreshCookie(req: HttpRequestContext) {
    const header = String(req.headers?.cookie ?? '');
    const match = header.match(/(?:^|;\s*)platform_admin_refresh=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  private meta(req: HttpRequestContext, deviceId?: string) {
    const userAgent = req.headers?.['user-agent'];
    return {
      ipAddress: this.clientIp(req),
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      deviceId,
    };
  }

  private clientIp(req: HttpRequestContext) {
    return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
  }
}
