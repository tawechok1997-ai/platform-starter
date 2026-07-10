import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { QueuesService } from './queues.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @RequirePermission('reports.view')
  @Get('summary')
  getSummary() {
    return this.queuesService.getSummary();
  }
}
