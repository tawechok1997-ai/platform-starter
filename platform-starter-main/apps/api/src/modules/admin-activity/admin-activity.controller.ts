import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminActivityService } from './admin-activity.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission('admin.activity.view')
@Controller('admin/activity')
export class AdminActivityController {
  constructor(private readonly service: AdminActivityService) {}

  @Get('timeline')
  timeline(@Query() query: { page?: string; take?: string; type?: string; from?: string; to?: string; search?: string; actor?: string; memberId?: string; refType?: string; refId?: string }) {
    return this.service.timeline(query);
  }
}
