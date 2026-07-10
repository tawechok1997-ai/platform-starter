import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AntiBotConfig, AntiBotService } from './anti-bot.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/security/anti-bot')
export class AntiBotAdminController {
  constructor(private readonly antiBot: AntiBotService) {}

  @RequirePermission('security.anti_bot.view')
  @Get()
  getConfig() {
    return this.antiBot.getAdminConfig();
  }

  @RequirePermission('security.anti_bot.update')
  @Put()
  updateConfig(
    @CurrentUser() user: any,
    @Body() body: Partial<AntiBotConfig> & { secret?: string },
    @Req() req: any,
  ) {
    return this.antiBot.updateConfig(user.id, body, this.meta(req));
  }

  @RequirePermission('security.anti_bot.test')
  @Post('test')
  testProvider(@CurrentUser() user: any, @Body('token') token: string, @Req() req: any) {
    return this.antiBot.testProvider(user.id, token, req.ip, this.meta(req));
  }

  private meta(req: any) {
    return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] };
  }
}

@Controller('public/anti-bot')
export class AntiBotPublicController {
  constructor(private readonly antiBot: AntiBotService) {}

  @Get('admin-login')
  adminLogin() {
    return this.antiBot.getPublicConfig('ADMIN_LOGIN');
  }

  @Get('member-login')
  memberLogin() {
    return this.antiBot.getPublicConfig('MEMBER_LOGIN');
  }

  @Get('member-register')
  memberRegister() {
    return this.antiBot.getPublicConfig('MEMBER_REGISTER');
  }
}
