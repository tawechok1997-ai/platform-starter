import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  AddRiskAlertNoteDto,
  AssignRiskAlertDto,
  BulkDismissRiskAlertsDto,
  RiskAlertListQueryDto,
  RiskAlertSuggestionQueryDto,
  UpdateRiskAlertStatusDto,
} from './dto/risk-alerts.dto';
import { RiskAlertsService } from './risk-alerts.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/risk-alerts')
export class RiskAlertsController {
  constructor(private readonly riskAlertsService: RiskAlertsService) {}

  @RequirePermission('risk.view')
  @Get()
  list(@Query() query: RiskAlertListQueryDto) {
    return this.riskAlertsService.list(query);
  }

  @RequirePermission('risk.assign')
  @Get('assignees/list')
  assignees() {
    return this.riskAlertsService.listAssignees();
  }

  @RequirePermission('risk.resolve')
  @Get('auto-close-suggestions')
  autoCloseSuggestions(@Query() query: RiskAlertSuggestionQueryDto) {
    return this.riskAlertsService.autoCloseSuggestions(Number(query.limit ?? 50));
  }

  @RequirePermission('risk.resolve')
  @Post('bulk-dismiss')
  bulkDismiss(@Body() body: BulkDismissRiskAlertsDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.riskAlertsService.bulkDismiss(body.ids, body.reason.trim(), admin);
  }

  @RequirePermission('risk.view')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.riskAlertsService.get(id);
  }

  @RequirePermission('risk.assign')
  @Patch(':id/assignment')
  assign(@Param('id') id: string, @Body() body: AssignRiskAlertDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.riskAlertsService.assign(id, body.adminUserId, admin);
  }

  @RequirePermission('risk.note')
  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: AddRiskAlertNoteDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.riskAlertsService.addNote(id, body.note, admin);
  }

  @RequirePermission('risk.resolve')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateRiskAlertStatusDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.riskAlertsService.updateStatus(id, body.status, admin);
  }

  @RequirePermission('risk.resolve')
  @Post('scan')
  scan(@CurrentUser() admin: AuthenticatedAdminActor) {
    return this.riskAlertsService.scan(admin);
  }
}
