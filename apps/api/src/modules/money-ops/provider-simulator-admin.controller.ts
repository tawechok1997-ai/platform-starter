import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ProviderSimulatorEnabledGuard } from '../../common/guards/provider-simulator-enabled.guard';
import { MoneyOpsService } from './money-ops.service';

@UseGuards(ProviderSimulatorEnabledGuard, AdminAuthGuard, PermissionsGuard)
@Controller('admin/money-ops/provider-simulator')
export class ProviderSimulatorAdminController {
  constructor(private readonly moneyOps: MoneyOpsService) {}

  @RequirePermission('game.providers.manage')
  @Post('webhook-test')
  webhookTest(@Body() body: unknown) {
    return this.moneyOps.simulatorWebhookTest(body as any);
  }
}
