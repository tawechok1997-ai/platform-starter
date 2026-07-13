import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  RegisterSupportAttachmentDto,
  SupportReplyDto,
} from './dto/support-ticket.dto';
import { SupportService } from './support.service';

type Actor = { id: string };

@Controller()
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets')
  createMemberTicket(@CurrentUser() user: Actor, @Body() body: CreateSupportTicketDto) {
    return this.support.createMemberTicket(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets')
  listMemberTickets(@CurrentUser() user: Actor, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.support.listMemberTickets(user, cursor, limit);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets/:id')
  getMemberTicket(@CurrentUser() user: Actor, @Param('id') id: string) {
    return this.support.getMemberTicket(user, id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/reply')
  memberReply(@CurrentUser() user: Actor, @Param('id') id: string, @Body() body: SupportReplyDto) {
    return this.support.memberReply(user, id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/attachments')
  registerMemberAttachment(@CurrentUser() user: Actor, @Param('id') id: string, @Body() body: RegisterSupportAttachmentDto) {
    return this.support.registerMemberAttachment(user, id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Delete('member/support-tickets/:id/attachments/:attachmentId')
  removeMemberAttachment(@CurrentUser() user: Actor, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.support.removeMemberAttachment(user, id, attachmentId);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.view')
  @Get('admin/support-tickets')
  listAdminTickets(@Query('status') status?: string, @Query('category') category?: string, @Query('search') search?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.support.listAdminTickets({ status, category, search, cursor, limit });
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
  adminReply(@CurrentUser() user: Actor, @Param('id') id: string, @Body() body: SupportReplyDto) {
    return this.support.adminReply(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.reply')
  @Post('admin/support-tickets/:id/attachments')
  registerAdminAttachment(@CurrentUser() user: Actor, @Param('id') id: string, @Body() body: RegisterSupportAttachmentDto) {
    return this.support.registerAdminAttachment(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.manage')
  @Delete('admin/support-tickets/:id/attachments/:attachmentId')
  removeAdminAttachment(@CurrentUser() user: Actor, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.support.removeAdminAttachment(user, id, attachmentId);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.manage')
  @Patch('admin/support-tickets/:id')
  adminUpdate(@CurrentUser() user: Actor, @Param('id') id: string, @Body() body: AdminUpdateSupportTicketDto) {
    return this.support.adminUpdate(user, id, body);
  }
}
