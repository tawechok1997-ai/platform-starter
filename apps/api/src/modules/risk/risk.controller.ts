import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RiskService } from './risk.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @RequirePermission('risk.view')
  @Get('summary')
  getSummary() {
    return this.riskService.getSummary();
  }
}
