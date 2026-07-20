import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminActivityQuery, AdminActivityQueryService } from '../admin-activity/admin-activity-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/operations')
export class OperationsController {
  constructor(private readonly adminActivityQuery: AdminActivityQueryService) {}

  @RequirePermission('admin.view')
  @Get('history')
  getHistory(@Query() query: AdminActivityQuery) {
    return this.adminActivityQuery.execute(query);
  }
}
