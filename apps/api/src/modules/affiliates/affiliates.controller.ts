import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AffiliatesService } from './affiliates.service';

@Controller()
export class AffiliatesController {
  constructor(private readonly affiliates: AffiliatesService) {}

  @UseGuards(MemberAuthGuard)
  @Get('member/affiliate/profile')
  getMemberProfile(@CurrentUser() user: any) {
    return this.affiliates.getMemberProfile(user);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/affiliate/profile')
  createOrUpdateMemberProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.affiliates.createOrUpdateMemberProfile(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/affiliate/link')
  linkReferral(@CurrentUser() user: any, @Body() body: any) {
    return this.affiliates.linkMemberReferral(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/affiliate/commissions')
  listMemberCommissions(@CurrentUser() user: any) {
    return this.affiliates.listMemberCommissions(user);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('affiliate.view')
  @Get('admin/affiliates')
  listAdminProfiles(@Query('status') status?: string) {
    return this.affiliates.listAdminProfiles({ status });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('affiliate.review')
  @Patch('admin/affiliates/:id/review')
  reviewProfile(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.affiliates.reviewProfile(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('commission.view')
  @Get('admin/commission-ledgers')
  listAdminCommissions(@Query('status') status?: string) {
    return this.affiliates.listAdminCommissions({ status });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('commission.view')
  @Post('admin/commission-ledgers/preview')
  previewCommission(@Body() body: any) {
    return this.affiliates.previewCommission(body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('commission.create')
  @Post('admin/commission-ledgers')
  createCommissionLedger(@CurrentUser() user: any, @Body() body: any) {
    return this.affiliates.createCommissionLedger(user, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('commission.review')
  @Patch('admin/commission-ledgers/:id/review')
  reviewCommission(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.affiliates.reviewCommission(user, id, body);
  }
}
