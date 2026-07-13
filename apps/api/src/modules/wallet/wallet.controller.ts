import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(MemberAuthGuard)
  @Get('member/wallet')
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getMemberWallet(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/wallet/ledger')
  getLedger(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.walletService.getMemberLedger(user.id, Number(limit ?? 50));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('wallet.view')
  @Get('admin/ledgers')
  getAdminLedgers(
    @Query('userId') userId?: string,
    @Query('identifier') identifier?: string,
    @Query('type') type?: string,
    @Query('direction') direction?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.walletService.getAdminLedgers({ userId, identifier, type, direction, limit, page, take });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('wallet.view')
  @Get('admin/wallets')
  getAdminWallets(@Query('search') search?: string, @Query('limit') limit?: string, @Query('page') page?: string, @Query('take') take?: string) {
    return this.walletService.getAdminWallets({ search, limit, page, take });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('wallet.view')
  @Get('admin/wallets/:userId')
  getAdminWalletDetail(@Param('userId') userId: string) {
    return this.walletService.getAdminWalletDetail(userId);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('wallet.adjust')
  @Post('admin/wallets/:userId/adjust')
  adjustWallet(@Param('userId') userId: string, @CurrentUser() user: any, @Body() body: AdjustWalletDto, @Req() req: any) {
    return this.walletService.adjustWallet(userId, user, body, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
