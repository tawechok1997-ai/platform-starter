import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ActivityMetricRequest, LotteryNumberRequest } from './activity-requests.dto';
import { MemberActivitiesService } from './member-activities.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/activities')
export class AdminActivitiesController {
  constructor(private readonly service: MemberActivitiesService) {}

  @RequirePermission('settings.features.view')
  @Get('overview')
  overview() {
    return this.service.adminOverview();
  }

  @RequirePermission('settings.features.view')
  @Get('claims')
  claims(@Query('take') take?: string) {
    return this.service.listAdminClaims(numberQuery(take, 200));
  }

  @RequirePermission('settings.features.view')
  @Get('lottery-entries')
  lotteryEntries(@Query('roundCode') roundCode?: string, @Query('take') take?: string) {
    return this.service.listLotteryEntries(roundCode, numberQuery(take, 200));
  }

  @RequirePermission('settings.features.update')
  @Post('metrics')
  async recordMetrics(@Body() body: ActivityMetricRequest | ActivityMetricRequest[]) {
    const items = Array.isArray(body) ? body : [body];
    const results = [];
    for (const item of items.slice(0, 500)) results.push(await this.service.recordMetric(item));
    return { success: true, count: results.length, results };
  }

  @RequirePermission('settings.features.update')
  @Post('lottery/:roundCode/result')
  publishLotteryResult(
    @CurrentUser() user: AuthenticatedAdminActor,
    @Param('roundCode') roundCode: string,
    @Body() body: LotteryNumberRequest,
  ) {
    return this.service.publishLotteryResult(user, roundCode, body);
  }
}

function numberQuery(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}
