import { Injectable } from '@nestjs/common';
import type { AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import {
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  RegisterSupportAttachmentDto,
  SupportReplyDto,
} from './dto/support-ticket.dto';
import type { AdminSupportTicketListQueryDto } from './dto/support-query.dto';
import { SupportCommandService } from './support-command.service';
import { SupportQueryService } from './support-query.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly queries: SupportQueryService,
    private readonly commands: SupportCommandService,
  ) {}

  createMemberTicket(user: MemberActor, input: CreateSupportTicketDto) {
    return this.commands.createMemberTicket(user, input);
  }

  listMemberTickets(user: MemberActor, cursor?: string, limit?: string) {
    return this.queries.listMemberTickets(user, cursor, limit);
  }

  getMemberTicket(user: MemberActor, id: string) {
    return this.queries.getMemberTicket(user, id);
  }

  memberReply(user: MemberActor, id: string, input: SupportReplyDto) {
    return this.commands.memberReply(user, id, input);
  }

  registerMemberAttachment(user: MemberActor, id: string, input: RegisterSupportAttachmentDto) {
    return this.commands.registerMemberAttachment(user, id, input);
  }

  removeMemberAttachment(user: MemberActor, id: string, attachmentId: string) {
    return this.commands.removeMemberAttachment(user, id, attachmentId);
  }

  listAdminTickets(query: AdminSupportTicketListQueryDto) {
    return this.queries.listAdminTickets(query);
  }

  getAdminTicket(id: string) {
    return this.queries.getAdminTicket(id);
  }

  adminReply(admin: AuthenticatedAdminActor, id: string, input: SupportReplyDto) {
    return this.commands.adminReply(admin, id, input);
  }

  registerAdminAttachment(admin: AuthenticatedAdminActor, id: string, input: RegisterSupportAttachmentDto) {
    return this.commands.registerAdminAttachment(admin, id, input);
  }

  removeAdminAttachment(admin: AuthenticatedAdminActor, id: string, attachmentId: string) {
    return this.commands.removeAdminAttachment(admin, id, attachmentId);
  }

  adminUpdate(admin: AuthenticatedAdminActor, id: string, input: AdminUpdateSupportTicketDto) {
    return this.commands.adminUpdate(admin, id, input);
  }
}
