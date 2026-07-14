import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MoneyOpsService } from './money-ops.service';
import { ProviderSimulatorEnabledGuard } from '../../common/guards/provider-simulator-enabled.guard';

type ProviderSimulatorRequest = Record<string, unknown>;

@UseGuards(ProviderSimulatorEnabledGuard)
@Controller('provider-simulator')
export class ProviderSimulatorController {
  constructor(private readonly moneyOps: MoneyOpsService) {}

  @Get('health') health() { return this.moneyOps.simulatorHealth(); }
  @Post('launch') launch(@Body() body: ProviderSimulatorRequest) { return this.moneyOps.simulatorLaunch(body); }
  @Post('balance') balance(@Body() body: ProviderSimulatorRequest) { return this.moneyOps.simulatorBalance(body); }
  @Post('transfer-in') transferIn(@Body() body: ProviderSimulatorRequest) { return this.moneyOps.simulatorTransfer(body, 'TRANSFER_IN'); }
  @Post('transfer-out') transferOut(@Body() body: ProviderSimulatorRequest) { return this.moneyOps.simulatorTransfer(body, 'TRANSFER_OUT'); }
  @Post('webhook') webhook(@Body() body: ProviderSimulatorRequest) { return this.moneyOps.simulatorWebhook(body); }
  @Post('timeout') timeout() { return this.moneyOps.simulatorTimeout(); }
}
