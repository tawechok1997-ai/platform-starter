import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { AdminRequestContext, AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { BankAccountsService } from './bank-accounts.service';
import {
  CreateMemberBankAccountDto,
  ReceivingBankAccountDto,
  ReviewMemberBankAccountDto,
  UpdateReceivingBankAccountDto,
} from './dto/bank-account-mutation.dto';

@Controller()
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @UseGuards(MemberAuthGuard)
  @Get('member/receiving-bank-accounts')
  getActiveReceivingAccounts() { return this.bankAccountsService.getActiveReceivingAccounts(); }

  @UseGuards(MemberAuthGuard)
  @Get('member/receiving-bank-account')
  getAssignedReceivingAccount(@Query('paymentType') paymentType?: string, @Query('amount') amount?: string) {
    return this.bankAccountsService.assignReceivingAccount(paymentType, amount);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/bank-accounts')
  getMemberBankAccounts(@CurrentUser() user: MemberActor) { return this.bankAccountsService.listMemberBankAccounts(user.id); }

  @UseGuards(MemberAuthGuard)
  @Post('member/bank-accounts')
  createMemberBankAccount(@CurrentUser() user: MemberActor, @Body() body: CreateMemberBankAccountDto) {
    return this.bankAccountsService.createMemberBankAccount(user.id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Patch('member/bank-accounts/:id/primary')
  setPrimary(@CurrentUser() user: MemberActor, @Param('id') id: string) {
    return this.bankAccountsService.setPrimaryMemberBankAccount(user.id, id);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.view')
  @Get('admin/receiving-bank-accounts')
  listReceivingAccounts() { return this.bankAccountsService.listReceivingAccounts(); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.manage')
  @Post('admin/receiving-bank-accounts')
  createReceivingAccount(@CurrentUser() user: AuthenticatedAdminActor, @Body() body: ReceivingBankAccountDto, @Req() req: AdminRequestContext) {
    return this.bankAccountsService.createReceivingAccount(body, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.manage')
  @Patch('admin/receiving-bank-accounts/:id')
  updateReceivingAccount(@Param('id') id: string, @CurrentUser() user: AuthenticatedAdminActor, @Body() body: UpdateReceivingBankAccountDto, @Req() req: AdminRequestContext) {
    return this.bankAccountsService.updateReceivingAccount(id, body, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.view')
  @Get('admin/member-bank-accounts')
  listMemberBankAccounts(@Query('search') search?: string) { return this.bankAccountsService.listAllMemberBankAccounts(search); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.view')
  @Get('admin/member-bank-accounts/kyc-summary')
  kycSummary() { return this.bankAccountsService.kycSummary(); }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('bank_accounts.review')
  @Patch('admin/member-bank-accounts/:id/review')
  reviewMemberBankAccount(@Param('id') id: string, @CurrentUser() user: AuthenticatedAdminActor, @Body() body: ReviewMemberBankAccountDto, @Req() req: AdminRequestContext) {
    return this.bankAccountsService.reviewMemberBankAccount(id, body, user, this.meta(req));
  }

  private meta(req: AdminRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}
