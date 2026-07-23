import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  LedgerMutationDto,
  MoneyOpsLedgerQueryDto,
  ResolveMoneyOpsRiskAlertDto,
  WriteMoneyOpsAuditDto,
} from './dto/money-ops.dto';
import { MoneyOpsLedgerQueryService } from './money-ops-ledger-query.service';
import { MoneyOpsService } from './money-ops.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/money-ops')
export class MoneyOpsController {
  constructor(
    private readonly moneyOps: MoneyOpsService,
    private readonly ledgerQuery: MoneyOpsLedgerQueryService,
  ) {}

  @RequirePermission('game.providers.view')
  @Get('control-center')
  controlCenter() { return this.moneyOps.financeControlCenter(); }

  @RequirePermission('game.providers.view')
  @Get('ledger')
  ledger(@Query() query: MoneyOpsLedgerQueryDto) { return this.ledgerQuery.list(query); }

  @RequirePermission('game.providers.manage')
  @Post('ledger/simulate')
  simulateLedger(@Body() body: LedgerMutationDto) { return this.moneyOps.simulateLedgerMutation(body); }

  @RequirePermission('game.providers.manage')
  @Post('ledger/mutate')
  mutateLedger(
    @Body() body: LedgerMutationDto,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Req() req: AdminRequestContext,
  ) {
    return this.moneyOps.mutateLedger(user, this.meta(req), body);
  }

  @RequirePermission('game.providers.manage')
  @Post('audit-events')
  writeAudit(
    @Body() body: WriteMoneyOpsAuditDto,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Req() req: AdminRequestContext,
  ) {
    return this.moneyOps.writeAudit(user, this.meta(req), body);
  }

  @RequirePermission('game.providers.view')
  @Get('alert-rules')
  alertRules() { return this.moneyOps.listAlertRules(); }

  @RequirePermission('game.providers.manage')
  @Post('alert-rules/scan')
  scanAlertRules(@CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) {
    return this.moneyOps.scanAlertRules(user, this.meta(req));
  }

  @RequirePermission('game.providers.manage')
  @Patch('risk-alerts/:id/resolve')
  resolveRiskAlert(
    @Param('id') id: string,
    @Body() body: ResolveMoneyOpsRiskAlertDto,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Req() req: AdminRequestContext,
  ) {
    return this.moneyOps.resolveRiskAlert(id, user, this.meta(req), body.note);
  }

  @RequirePermission('game.providers.manage')
  @Patch('risk-alerts/:id/dismiss')
  dismissRiskAlert(
    @Param('id') id: string,
    @Body() body: ResolveMoneyOpsRiskAlertDto,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Req() req: AdminRequestContext,
  ) {
    return this.moneyOps.dismissRiskAlert(id, user, this.meta(req), body.note);
  }

  @RequirePermission('game.providers.view')
  @Get('provider-simulator/scenarios')
  simulatorScenarios() { return this.moneyOps.simulatorScenarios(); }

  @RequirePermission('game.providers.view')
  @Get('security-hardening')
  securityHardening() { return this.moneyOps.securityHardeningChecklist(); }

  private meta(req: AdminRequestContext) {
    const rawUserAgent = req.headers?.['user-agent'];
    const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;
    return { ipAddress: req.ip, userAgent };
  }
}
