import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RiskService } from './risk.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('summary')
  getSummary() {
    return this.riskService.getSummary();
  }
}
