import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RiskAlertsService } from './risk-alerts.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/risk-alerts')
export class RiskAlertsController {
  constructor(private readonly riskAlertsService: RiskAlertsService) {}

  @RequirePermission('risk.view')
  @Get()
  list(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.riskAlertsService.list({ status, severity, type, createdFrom, createdTo, page, take });
  }

  @RequirePermission('risk.view')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.riskAlertsService.get(id);
  }

  @RequirePermission('risk.resolve')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status?: string }, @CurrentUser() admin: any) {
    return this.riskAlertsService.updateStatus(id, body.status, admin);
  }

  @RequirePermission('risk.resolve')
  @Post('scan')
  scan(@CurrentUser() admin: any) {
    return this.riskAlertsService.scan(admin);
  }
}
