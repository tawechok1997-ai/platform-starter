import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { ReviewWithdrawalRequestDto } from './dto/review-withdrawal-request.dto';
import { WithdrawalsService } from './withdrawals.service';

@Controller()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/withdrawals')
  createMemberRequest(@CurrentUser() user: any, @Body() body: CreateWithdrawalRequestDto, @Headers('idempotency-key') idempotencyKey?: string) { return this.withdrawalsService.createMemberRequest(user.id, body, idempotencyKey); }

  @UseGuards(MemberAuthGuard)
  @Get('member/withdrawals')
  getMemberRequests(@CurrentUser() user: any) { return this.withdrawalsService.getMemberRequests(user.id); }

  @UseGuards(MemberAuthGuard)
  @Get('member/withdrawals/:id')
  getMemberRequest(@CurrentUser() user: any, @Param('id') id: string) { return this.withdrawalsService.getMemberRequest(user.id, id); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.view')
  @Get('admin/withdrawals')
  getAdminRequests(@Query('status') status?: string, @Query('page') page?: string, @Query('take') take?: string) { return this.withdrawalsService.getAdminRequests(status, { page, take }); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.view')
  @Get('admin/withdrawals/:id')
  getAdminRequest(@Param('id') id: string) { return this.withdrawalsService.getAdminRequest(id); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.review')
  @Post('admin/withdrawals/:id/claim')
  claimRequest(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) { return this.withdrawalsService.claimRequest(id, user, this.meta(req)); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.review')
  @Post('admin/withdrawals/:id/release')
  releaseRequest(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) { return this.withdrawalsService.releaseRequest(id, user, this.meta(req)); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.review')
  @Post('admin/withdrawals/:id/approve')
  approveRequest(@Param('id') id: string, @CurrentUser() user: any, @Body() body: ReviewWithdrawalRequestDto, @Req() req: any) { return this.withdrawalsService.approveRequest(id, user, body, this.meta(req)); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.withdrawals.review')
  @Post('admin/withdrawals/:id/reject')
  rejectRequest(@Param('id') id: string, @CurrentUser() user: any, @Body() body: ReviewWithdrawalRequestDto, @Req() req: any) { return this.withdrawalsService.rejectRequest(id, user, body, this.meta(req)); }

  private meta(req: any) { return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] }; }
}
