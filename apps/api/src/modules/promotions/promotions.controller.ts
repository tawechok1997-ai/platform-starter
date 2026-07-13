import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  AddBonusTurnoverDto,
  CreatePromotionClaimDto,
  PromotionStatusQueryDto,
  ReviewPromotionClaimDto,
  UpdateBonusLifecycleDto,
} from './dto/promotions.dto';
import { PromotionsService } from './promotions.service';

@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('public/promotions')
  listPublicCampaigns() {
    return this.promotions.listPublicCampaigns();
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/promotion-claims')
  listMemberClaims(@CurrentUser() user: MemberActor) {
    return this.promotions.listMemberClaims(user);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/promotion-claims')
  createClaim(@CurrentUser() user: MemberActor, @Body() body: CreatePromotionClaimDto) {
    return this.promotions.createClaim(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/bonus-ledgers')
  listMemberBonusLedgers(@CurrentUser() user: MemberActor) {
    return this.promotions.listMemberBonusLedgers(user);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('promotions.claims.view')
  @Get('admin/promotion-claims')
  listAdminClaims(@Query() query: PromotionStatusQueryDto) {
    return this.promotions.listAdminClaims(query);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('promotions.claims.review')
  @Patch('admin/promotion-claims/:id/review')
  reviewClaim(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: ReviewPromotionClaimDto) {
    return this.promotions.reviewClaim(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.ledger.view')
  @Get('admin/bonus-ledgers')
  listAdminBonusLedgers(@Query() query: PromotionStatusQueryDto) {
    return this.promotions.listAdminBonusLedgers(query);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.turnover.update')
  @Patch('admin/bonus-ledgers/:id/turnover-progress')
  addTurnoverProgress(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: AddBonusTurnoverDto) {
    return this.promotions.addTurnoverProgress(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bonus.lifecycle.update')
  @Patch('admin/bonus-ledgers/:id/lifecycle')
  updateBonusLifecycle(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: UpdateBonusLifecycleDto) {
    return this.promotions.updateBonusLifecycle(user, id, body);
  }
}
