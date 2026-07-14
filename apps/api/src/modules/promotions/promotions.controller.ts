import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BonusLifecycleCommandService } from './bonus-lifecycle-command.service';
import { AddBonusTurnoverDto, CreatePromotionClaimDto, PromotionStatusQueryDto, ReviewPromotionClaimDto, UpdateBonusLifecycleDto } from './dto/promotions.dto';
import { PromotionClaimCommandService } from './promotion-claim-command.service';
import { PromotionsQueryService } from './promotions-query.service';

@Controller()
export class PromotionsController {
  constructor(
    private readonly queries: PromotionsQueryService,
    private readonly claimCommands: PromotionClaimCommandService,
    private readonly bonusCommands: BonusLifecycleCommandService,
  ) {}

  @Get('public/promotions')
  listPublicCampaigns() { return this.queries.listPublicCampaigns(); }

  @UseGuards(MemberAuthGuard)
  @Get('member/promotion-claims')
  listMemberClaims(@CurrentUser() user: MemberActor) { return this.queries.listMemberClaims(user.id); }

  @UseGuards(MemberAuthGuard)
  @Post('member/promotion-claims')
  createClaim(@CurrentUser() user: MemberActor, @Body() body: CreatePromotionClaimDto) { return this.claimCommands.createClaim(user, body); }

  @UseGuards(MemberAuthGuard)
  @Get('member/bonus-ledgers')
  listMemberBonusLedgers(@CurrentUser() user: MemberActor) { return this.queries.listMemberBonusLedgers(user.id); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('promotions.claims.view')
  @Get('admin/promotion-claims')
  listAdminClaims(@Query() query: PromotionStatusQueryDto) { return this.queries.listAdminClaims(query.status); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('promotions.claims.review')
  @Patch('admin/promotion-claims/:id/review')
  reviewClaim(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: ReviewPromotionClaimDto) { return this.claimCommands.reviewClaim(user, id, body); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.ledger.view')
  @Get('admin/bonus-ledgers')
  listAdminBonusLedgers(@Query() query: PromotionStatusQueryDto) { return this.queries.listAdminBonusLedgers(query.status); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.turnover.update')
  @Patch('admin/bonus-ledgers/:id/turnover-progress')
  addTurnoverProgress(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: AddBonusTurnoverDto) { return this.bonusCommands.addTurnoverProgress(user, id, body); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.lifecycle.update')
  @Patch('admin/bonus-ledgers/:id/lifecycle')
  updateBonusLifecycle(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: UpdateBonusLifecycleDto) { return this.bonusCommands.updateBonusLifecycle(user, id, body); }
}
