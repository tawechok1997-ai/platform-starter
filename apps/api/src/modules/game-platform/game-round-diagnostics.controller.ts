import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { GameRoundDiagnosticsService } from './game-round-diagnostics.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-round-diagnostics')
export class GameRoundDiagnosticsController {
  constructor(private readonly diagnostics: GameRoundDiagnosticsService) {}

  @RequirePermission('game.providers.manage')
  @Post('scan-stale')
  scanStale(@Query('minutes') minutes?: string, @Query('limit') limit?: string) {
    return this.diagnostics.scanStaleRounds(Number(minutes ?? 30), Number(limit ?? 100));
  }

  @RequirePermission('game.providers.view')
  @Get('total-mismatches')
  totalMismatches(@Query('limit') limit?: string) {
    return this.diagnostics.reconcileRoundTotals(Number(limit ?? 100));
  }

  @RequirePermission('game.providers.view')
  @Get('missing-ledger-links')
  missingLedgerLinks(@Query('limit') limit?: string) {
    return this.diagnostics.findMissingLedgerLinks(Number(limit ?? 100));
  }
}
