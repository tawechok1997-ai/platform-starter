import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdapterTestService } from './adapter-test.service';
import { AdapterTestRequestDto } from './dto/game-platform-mutation.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-providers/:providerId/adapter-test')
export class AdapterTestController {
  constructor(private readonly adapterTestService: AdapterTestService) {}
  @RequirePermission('game.providers.view') @Get() listMethods(@Param('providerId') providerId: string) { return this.adapterTestService.listMethods(providerId); }
  @RequirePermission('game.providers.view') @Get('history') history(@Param('providerId') providerId: string) { return this.adapterTestService.history(providerId); }
  @RequirePermission('game.providers.manage') @Post(':method') run(@Param('providerId') providerId: string, @Param('method') method: any, @Body() body: AdapterTestRequestDto, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.adapterTestService.run(providerId, method, body ?? {}, user, this.meta(req)); }
  private meta(req: AdminRequestContext) { const userAgent = req.headers?.['user-agent']; return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent }; }
}
