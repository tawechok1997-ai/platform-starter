import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuditService, AuditLogQuery } from './admin-audit.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @RequirePermission('admin.access.view')
  @Get('risk-summary')
  riskSummary(@Query() query: AuditLogQuery) {
    return this.service.riskSummary(query);
  }

  @RequirePermission('admin.access.view')
  @Get()
  list(@Query() query: AuditLogQuery) {
    return this.service.list(query);
  }
}
