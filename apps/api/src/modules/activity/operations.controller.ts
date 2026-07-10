import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { ActivityService } from './activity.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/operations')
export class OperationsController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('history')
  getHistory(@Query() query: { module?: string; action?: string; adminUserId?: string; limit?: string }) {
    return this.activityService.getAdminActivity(query);
  }
}
