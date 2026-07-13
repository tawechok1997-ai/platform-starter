import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { SupportService } from './support.service';

@Controller()
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets')
  createMemberTicket(@CurrentUser() user: any, @Body() body: any) {
    return this.support.createMemberTicket(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets')
  listMemberTickets(@CurrentUser() user: any) {
    return this.support.listMemberTickets(user);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets/:id')
  getMemberTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.support.getMemberTicket(user, id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/reply')
  memberReply(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.support.memberReply(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.view')
  @Get('admin/support-tickets')
  listAdminTickets(@Query('status') status?: string, @Query('category') category?: string) {
    return this.support.listAdminTickets({ status, category });
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.view')
  @Get('admin/support-tickets/:id')
  getAdminTicket(@Param('id') id: string) {
    return this.support.getAdminTicket(id);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.reply')
  @Post('admin/support-tickets/:id/reply')
  adminReply(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.support.adminReply(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.manage')
  @Patch('admin/support-tickets/:id')
  adminUpdate(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.support.adminUpdate(user, id, body);
  }
}
