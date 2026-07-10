import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ActivityService } from './activity.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/operations')
export class OperationsController {
  constructor(private readonly activityService: ActivityService) {}

  @RequirePermission('admin.view')
  @Get('history')
  getHistory(@Query() query: { module?: string; action?: string; adminUserId?: string; limit?: string }) {
    return this.activityService.getAdminActivity(query);
  }
}
