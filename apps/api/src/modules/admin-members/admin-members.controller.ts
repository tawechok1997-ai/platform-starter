import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { getRequestMeta } from '../../common/http/request-meta';
import { AdminMembersCommandService } from './admin-members-command.service';
import { AdminMembersQueryService } from './admin-members-query.service';
import { UpdateAdminMemberStatusDto } from './dto/admin-member-status.dto';
import { AdminMembersQueryDto } from './dto/admin-members-query.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/members')
export class AdminMembersController {
  constructor(
    private readonly queries: AdminMembersQueryService,
    private readonly commands: AdminMembersCommandService,
  ) {}

  @RequirePermission('users.view')
  @Get()
  listMembers(@Query() query: AdminMembersQueryDto) {
    return this.queries.listMembers(query);
  }

  @RequirePermission('users.view')
  @Get('insights')
  getMemberInsights(@Query() query: AdminMembersQueryDto) {
    return this.queries.getMemberInsights(query);
  }

  @RequirePermission('users.view')
  @Get(':id')
  getMemberDetail(@Param('id') id: string) {
    return this.queries.getMemberDetail(id);
  }

  @RequirePermission('users.suspend')
  @Patch(':id/status')
  updateMemberStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdminMemberStatusDto,
    @CurrentUser() admin: AuthenticatedAdminActor,
    @Req() req: AdminRequestContext,
  ) {
    return this.commands.updateMemberStatus(
      id,
      body.status,
      body.reason,
      admin,
      getRequestMeta(req),
    );
  }
}
