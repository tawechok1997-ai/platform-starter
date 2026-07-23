import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext } from '../../common/actors';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';
import { AdminInvitationReissueDto } from './dto/admin-invitation-reissue.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access/invitations')
export class AdminInvitationAdminController {
  constructor(private readonly service: AdminInvitationAdminService) {}

  @RequirePermission('admin.create')
  @Get('roles')
  roles(@Req() req: AdminRequestContext) {
    return this.service.listAssignableRoles(req.user.id);
  }

  @RequirePermission('admin.create')
  @Get()
  list() {
    return this.service.list();
  }

  @RequirePermission('admin.create')
  @Post(':adminUserId/reissue')
  reissue(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: AdminInvitationReissueDto,
  ) {
    return this.service.reissue(req.user.id, adminUserId, body.expiresInHours ?? 24);
  }

  @RequirePermission('admin.create')
  @Delete(':adminUserId')
  revoke(@Req() req: AdminRequestContext, @Param('adminUserId') adminUserId: string) {
    return this.service.revoke(req.user.id, adminUserId);
  }
}
