import { Injectable } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { AdminMembersCommandService } from './admin-members-command.service';
import { AdminMembersQueryService } from './admin-members-query.service';
import type { AdminMembersQueryDto } from './dto/admin-members-query.dto';

@Injectable()
export class AdminMembersService {
  constructor(
    private readonly queries: AdminMembersQueryService,
    private readonly commands: AdminMembersCommandService,
  ) {}

  listMembers(query: AdminMembersQueryDto) {
    return this.queries.listMembers(query);
  }

  getMemberDetail(id: string) {
    return this.queries.getMemberDetail(id);
  }

  updateMemberStatus(
    id: string,
    status: string | undefined,
    reason: string | undefined,
    admin: AuthenticatedAdminActor,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    return this.commands.updateMemberStatus(id, status, reason, admin, meta);
  }
}
