import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RiskAlertsService } from './risk-alerts.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/risk-alerts')
export class RiskAlertsController {
  constructor(private readonly riskAlertsService: RiskAlertsService) {}

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

  @Get(':id')
  get(@Param('id') id: string) {
    return this.riskAlertsService.get(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status?: string }, @CurrentUser() admin: any) {
    return this.riskAlertsService.updateStatus(id, body.status, admin);
  }

  @Post('scan')
  scan(@CurrentUser() admin: any) {
    return this.riskAlertsService.scan(admin);
  }
}
