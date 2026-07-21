import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { CreateTopUpRequestDto } from './dto/create-top-up-request.dto';
import { TopUpsService } from './topups.service';
import { BatchClaimDto } from './dto/batch-claim.dto';

@Controller()
export class TopUpsController {
  constructor(private readonly topUpsService: TopUpsService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/topups')
  createMemberRequest(@CurrentUser() user: any, @Body() body: CreateTopUpRequestDto, @Headers('idempotency-key') idempotencyKey?: string) {
    return this.topUpsService.createMemberRequest(user.id, body, idempotencyKey);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/topups')
  getMemberRequests(@CurrentUser() user: any) {
    return this.topUpsService.getMemberRequests(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/topups/:id')
  getMemberRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.topUpsService.getMemberRequest(user.id, id);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.view')
  @Get('admin/topups')
  getAdminRequests(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.topUpsService.getAdminRequests(status, { page, take });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.view')
  @Get('admin/topups/:id')
  getAdminRequest(@Param('id') id: string) {
    return this.topUpsService.getAdminRequest(id);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/:id/claim')
  claimRequest(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.topUpsService.claimRequest(id, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/:id/release')
  releaseRequest(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return this.topUpsService.releaseRequest(id, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/batch/:action')
  batchClaimOrRelease(@Param('action') action: 'claim' | 'release', @Body() body: BatchClaimDto, @CurrentUser() user: any, @Req() req: any) {
    return this.topUpsService.batchClaimOrRelease(action, body.ids, user, this.meta(req));
  }

  private meta(req: any) { return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] }; }
}
