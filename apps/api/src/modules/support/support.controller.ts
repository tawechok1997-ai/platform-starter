import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UploadSupportAttachmentDto } from './dto/support-attachment-upload.dto';
import {
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  RegisterSupportAttachmentDto,
  SupportReplyDto,
} from './dto/support-ticket.dto';
import { AdminSupportTicketListQueryDto, MemberSupportTicketListQueryDto } from './dto/support-query.dto';
import { SupportAttachmentsService } from './support-attachments.service';
import { SupportService } from './support.service';

type BinaryResponse = {
  type(contentType: string): BinaryResponse;
  send(data: Buffer): unknown;
};

@Controller()
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly attachments: SupportAttachmentsService,
  ) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets')
  createMemberTicket(@CurrentUser() user: MemberActor, @Body() body: CreateSupportTicketDto) {
    return this.support.createMemberTicket(user, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets')
  listMemberTickets(@CurrentUser() user: MemberActor, @Query() query: MemberSupportTicketListQueryDto) {
    return this.support.listMemberTickets(user, query.cursor, query.limit);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets/:id')
  getMemberTicket(@CurrentUser() user: MemberActor, @Param('id') id: string) {
    return this.support.getMemberTicket(user, id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/reply')
  memberReply(@CurrentUser() user: MemberActor, @Param('id') id: string, @Body() body: SupportReplyDto) {
    return this.support.memberReply(user, id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/attachments')
  registerMemberAttachment(@CurrentUser() user: MemberActor, @Param('id') id: string, @Body() body: RegisterSupportAttachmentDto) {
    return this.support.registerMemberAttachment(user, id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/support-tickets/:id/attachments/upload')
  uploadMemberAttachment(@CurrentUser() user: MemberActor, @Param('id') id: string, @Body() body: UploadSupportAttachmentDto) {
    return this.attachments.uploadMember(user, id, body);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/support-tickets/:id/attachments/:attachmentId/content')
  async readMemberAttachment(
    @CurrentUser() user: MemberActor,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: BinaryResponse,
  ) {
    const stored = await this.attachments.readMember(user, id, attachmentId);
    response.type(stored.contentType).send(stored.data);
  }

  @UseGuards(MemberAuthGuard)
  @Delete('member/support-tickets/:id/attachments/:attachmentId')
  removeMemberAttachment(@CurrentUser() user: MemberActor, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.support.removeMemberAttachment(user, id, attachmentId);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.view')
  @Get('admin/support-tickets')
  listAdminTickets(@Query() query: AdminSupportTicketListQueryDto) {
    return this.support.listAdminTickets(query);
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
  adminReply(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: SupportReplyDto) {
    return this.support.adminReply(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.reply')
  @Post('admin/support-tickets/:id/attachments')
  registerAdminAttachment(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: RegisterSupportAttachmentDto) {
    return this.support.registerAdminAttachment(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.reply')
  @Post('admin/support-tickets/:id/attachments/upload')
  uploadAdminAttachment(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: UploadSupportAttachmentDto) {
    return this.attachments.uploadAdmin(user, id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.view')
  @Get('admin/support-tickets/:id/attachments/:attachmentId/content')
  async readAdminAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: BinaryResponse) {
    const stored = await this.attachments.readAdmin(id, attachmentId);
    response.type(stored.contentType).send(stored.data);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.manage')
  @Delete('admin/support-tickets/:id/attachments/:attachmentId')
  removeAdminAttachment(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.support.removeAdminAttachment(user, id, attachmentId);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('support.manage')
  @Patch('admin/support-tickets/:id')
  adminUpdate(@CurrentUser() user: AuthenticatedAdminActor, @Param('id') id: string, @Body() body: AdminUpdateSupportTicketDto) {
    return this.support.adminUpdate(user, id, body);
  }
}
