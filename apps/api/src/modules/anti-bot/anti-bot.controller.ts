import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminRequestContext, AuthenticatedAdminActor, HttpRequestContext } from '../../common/actors';
import { AntiBotService } from './anti-bot.service';
import { TestAntiBotProviderDto, UpdateAntiBotConfigDto } from './dto/anti-bot-request.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/security/anti-bot')
export class AntiBotAdminController {
  constructor(private readonly antiBot: AntiBotService) {}

  @RequirePermission('security.anti_bot.view')
  @Get()
  getConfig() { return this.antiBot.getAdminConfig(); }

  @RequirePermission('security.anti_bot.update')
  @Put()
  updateConfig(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: UpdateAntiBotConfigDto, @Req() req: AdminRequestContext) {
    return this.antiBot.updateConfig(user.id, body, this.meta(req));
  }

  @RequirePermission('security.anti_bot.test')
  @Post('test')
  testProvider(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: TestAntiBotProviderDto, @Req() req: AdminRequestContext) {
    return this.antiBot.testProvider(user.id, body.token, req.ip, this.meta(req));
  }

  private meta(req: AdminRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}

@Controller('public/anti-bot')
export class AntiBotPublicController {
  constructor(private readonly antiBot: AntiBotService) {}
  @Get('admin-login') adminLogin(@Req() req: HttpRequestContext) { return this.antiBot.getPublicConfig('ADMIN_LOGIN', req.ip); }
  @Get('member-login') memberLogin(@Req() req: HttpRequestContext) { return this.antiBot.getPublicConfig('MEMBER_LOGIN', req.ip); }
  @Get('member-register') memberRegister(@Req() req: HttpRequestContext) { return this.antiBot.getPublicConfig('MEMBER_REGISTER', req.ip); }
  @Get('member-password-reset') memberPasswordReset(@Req() req: HttpRequestContext) { return this.antiBot.getPublicConfig('MEMBER_PASSWORD_RESET', req.ip); }
}
