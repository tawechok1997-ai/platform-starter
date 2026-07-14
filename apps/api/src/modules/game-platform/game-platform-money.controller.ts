import { Body, Controller, Get, Headers, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor, HttpRequestContext, MemberActor, MemberRequestContext } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ProviderWebhookPayloadDto } from './dto/game-platform-mutation.dto';
import { ReviewDto, normalizeReviewNote, normalizeSnapshotReview } from './dto/game-review.dto';
import { CreateGameTransferDto, normalizeTransferAmount } from './dto/game-transfer.dto';
import { ProviderGatesDto, normalizeProviderGatesDto } from './dto/provider-gates.dto';
import { GamePlatformMoneyService } from './game-platform-money.service';
import { ProviderTransferCommandService } from './provider-transfer-command.service';
import { ProviderWebhookService } from './provider-webhook.service';

@UseGuards(MemberAuthGuard)
@Controller('member')
export class MemberGameTransferController {
  constructor(
    private readonly moneyService: GamePlatformMoneyService,
    private readonly transferCommands: ProviderTransferCommandService,
  ) {}

  @Get('game-sessions/:sessionId/transfers')
  listSessionTransfers(@Param('sessionId') sessionId: string, @CurrentUser() user: MemberActor) { return this.moneyService.listMemberSessionTransfers(sessionId, user); }

  @Post('game-sessions/:sessionId/transfer-in')
  transferIn(@Param('sessionId') sessionId: string, @Body() body: CreateGameTransferDto, @CurrentUser() user: MemberActor, @Req() req: MemberRequestContext) { return this.transferCommands.transfer(sessionId, user, 'TRANSFER_IN', normalizeTransferAmount(body), this.meta(req)); }

  @Post('game-sessions/:sessionId/transfer-out')
  transferOut(@Param('sessionId') sessionId: string, @Body() body: CreateGameTransferDto, @CurrentUser() user: MemberActor, @Req() req: MemberRequestContext) { return this.transferCommands.transfer(sessionId, user, 'TRANSFER_OUT', normalizeTransferAmount(body), this.meta(req)); }

  private meta(req: MemberRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminGameMoneyController {
  constructor(
    private readonly moneyService: GamePlatformMoneyService,
    private readonly transferCommands: ProviderTransferCommandService,
  ) {}

  @RequirePermission('game.providers.view')
  @Get('game-providers/:providerId/risk-panel')
  providerRiskPanel(@Param('providerId') providerId: string) { return this.moneyService.providerRiskPanel(providerId); }

  @RequirePermission('game.providers.view')
  @Get('game-providers/:providerId/preflight')
  realMoneyPreflight(@Param('providerId') providerId: string) { return this.moneyService.realMoneyPreflight(providerId); }

  @RequirePermission('game.providers.manage')
  @Patch('game-providers/:providerId/gates')
  updateProviderGates(@Param('providerId') providerId: string, @Body() body: ProviderGatesDto, @CurrentUser() user: AuthenticatedAdminActor) { return this.moneyService.updateProviderGates(providerId, user, normalizeProviderGatesDto(body)); }

  @RequirePermission('game.providers.view')
  @Get('game-transfers')
  listTransfers() { return this.moneyService.listTransfers(); }

  @RequirePermission('game.providers.view')
  @Get('game-transfers/:id')
  getTransfer(@Param('id') id: string) { return this.moneyService.getTransfer(id); }

  @RequirePermission('game.providers.manage')
  @Patch('game-transfers/:id/review')
  reviewTransfer(@Param('id') id: string, @Body() body: ReviewDto, @CurrentUser() user: AuthenticatedAdminActor) { return this.moneyService.reviewTransfer(id, user, normalizeReviewNote(body)); }

  @RequirePermission('game.providers.manage')
  @Post('game-transfers/:id/retry-dry-run')
  retryDryRunTransfer(@Param('id') id: string, @Body() body: ReviewDto, @CurrentUser() user: AuthenticatedAdminActor) { return this.transferCommands.retry(id, user, normalizeReviewNote(body)); }

  @RequirePermission('game.providers.manage')
  @Post('game-sessions/:sessionId/reconcile')
  reconcileSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedAdminActor) { return this.moneyService.reconcileSession(sessionId, user); }

  @RequirePermission('game.providers.manage')
  @Post('game-sessions/reconcile-active')
  reconcileActiveSessions(@CurrentUser() user: AuthenticatedAdminActor) { return this.moneyService.reconcileActiveSessions(user); }

  @RequirePermission('game.providers.view')
  @Get('provider-wallet-snapshots')
  listSnapshots() { return this.moneyService.listSnapshots(); }

  @RequirePermission('game.providers.view')
  @Get('provider-wallet-snapshots/:id')
  getSnapshot(@Param('id') id: string) { return this.moneyService.getSnapshot(id); }

  @RequirePermission('game.providers.manage')
  @Patch('provider-wallet-snapshots/:id/review')
  reviewSnapshot(@Param('id') id: string, @Body() body: ReviewDto, @CurrentUser() user: AuthenticatedAdminActor) { return this.moneyService.reviewSnapshot(id, user, normalizeSnapshotReview(body)); }

  @RequirePermission('game.providers.view')
  @Get('webhook-logs')
  listWebhookLogs() { return this.moneyService.listWebhookLogs(); }

  @RequirePermission('game.providers.view')
  @Get('webhook-logs/:id')
  getWebhookLog(@Param('id') id: string) { return this.moneyService.getWebhookLog(id); }
}

@Controller('provider-webhooks')
export class ProviderWebhookController {
  constructor(private readonly webhooks: ProviderWebhookService) {}

  @Post(':providerCode')
  receive(@Param('providerCode') providerCode: string, @Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderWebhookPayloadDto, @Req() req: HttpRequestContext) { return this.webhooks.receive(providerCode, headers, body, req.rawBody); }
}
