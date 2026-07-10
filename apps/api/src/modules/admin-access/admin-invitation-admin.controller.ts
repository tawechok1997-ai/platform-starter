import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access/invitations')
export class AdminInvitationAdminController {
  constructor(private readonly service: AdminInvitationAdminService) {}

  @RequirePermission('admin.create')
  @Get()
  list() {
    return this.service.list();
  }

  @RequirePermission('admin.create')
  @Post(':adminUserId/reissue')
  reissue(
    @Req() req: any,
    @Param('adminUserId') adminUserId: string,
    @Body() body: { expiresInHours?: number },
  ) {
    return this.service.reissue(req.user.id, adminUserId, Number(body.expiresInHours ?? 24));
  }

  @RequirePermission('admin.create')
  @Delete(':adminUserId')
  revoke(@Req() req: any, @Param('adminUserId') adminUserId: string) {
    return this.service.revoke(req.user.id, adminUserId);
  }
}
