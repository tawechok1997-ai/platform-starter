import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { BankAccountsService } from './bank-accounts.service';

@Controller()
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @UseGuards(MemberAuthGuard)
  @Get('member/receiving-bank-accounts')
  getActiveReceivingAccounts() {
    return this.bankAccountsService.getActiveReceivingAccounts();
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/receiving-bank-account')
  getAssignedReceivingAccount(@Query('paymentType') paymentType?: string, @Query('amount') amount?: string) {
    return this.bankAccountsService.assignReceivingAccount(paymentType, amount);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/bank-accounts')
  getMemberBankAccounts(@CurrentUser() user: any) {
    return this.bankAccountsService.listMemberBankAccounts(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/bank-accounts')
  createMemberBankAccount(@CurrentUser() user: any, @Body() body: any) {
    return this.bankAccountsService.createMemberBankAccount(user.id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Patch('member/bank-accounts/:id/primary')
  setPrimary(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bankAccountsService.setPrimaryMemberBankAccount(user.id, id);
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/receiving-bank-accounts')
  listReceivingAccounts() {
    return this.bankAccountsService.listReceivingAccounts();
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/receiving-bank-accounts')
  createReceivingAccount(@CurrentUser() user: any, @Body() body: any, @Req() req: any) {
    return this.bankAccountsService.createReceivingAccount(body, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/receiving-bank-accounts/:id')
  updateReceivingAccount(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any, @Req() req: any) {
    return this.bankAccountsService.updateReceivingAccount(id, body, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/member-bank-accounts')
  listMemberBankAccounts(@Query('search') search?: string) {
    return this.bankAccountsService.listAllMemberBankAccounts(search);
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/member-bank-accounts/kyc-summary')
  kycSummary() {
    return this.bankAccountsService.kycSummary();
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/member-bank-accounts/:id/review')
  reviewMemberBankAccount(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any, @Req() req: any) {
    return this.bankAccountsService.reviewMemberBankAccount(id, body, user, this.meta(req));
  }

  private meta(req: any) {
    return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] };
  }
}
