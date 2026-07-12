import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MoneyOpsService } from './money-ops.service';
import { ProviderSimulatorEnabledGuard } from '../../common/guards/provider-simulator-enabled.guard';

@UseGuards(ProviderSimulatorEnabledGuard)
@Controller('provider-simulator')
export class ProviderSimulatorController {
  constructor(private readonly moneyOps: MoneyOpsService) {}

  @Get('health')
  health() { return this.moneyOps.simulatorHealth(); }

  @Post('launch')
  launch(@Body() body: unknown) { return this.moneyOps.simulatorLaunch(body); }

  @Post('balance')
  balance(@Body() body: unknown) { return this.moneyOps.simulatorBalance(body); }

  @Post('transfer-in')
  transferIn(@Body() body: unknown) { return this.moneyOps.simulatorTransfer(body, 'TRANSFER_IN'); }

  @Post('transfer-out')
  transferOut(@Body() body: unknown) { return this.moneyOps.simulatorTransfer(body, 'TRANSFER_OUT'); }

  @Post('webhook')
  webhook(@Body() body: unknown) { return this.moneyOps.simulatorWebhook(body); }

  @Post('timeout')
  timeout() { return this.moneyOps.simulatorTimeout(); }
}
