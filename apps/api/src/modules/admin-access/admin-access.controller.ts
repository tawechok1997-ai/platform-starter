import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAccessSessionService } from './admin-access-session.service';
import { AdminAccessService } from './admin-access.service';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access')
export class AdminAccessController {
  constructor(
    private readonly service: AdminAccessService,
    private readonly accessSessions: AdminAccessSessionService,
    private readonly accountLifecycle: AdminAccountLifecycleService,
  ) {}

  @RequirePermission('admin.access.view')
  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @RequirePermission('admin.access.manage')
  @Post('ownership-transfer')
  async transferOwnership(
    @Req() req: any,
    @Body() body: { targetAdminId?: string; twoFactorCode?: string },
  ) {
    const result = await this.service.transferOwnership(
      req.user.id,
      String(body.targetAdminId ?? ''),
      String(body.twoFactorCode ?? ''),
      { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] },
    );
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, req.user.id, 'TRANSFER_OWNERSHIP_OUT');
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, result.newOwnerId, 'TRANSFER_OWNERSHIP_IN');
    return result;
  }

  @RequirePermission('admin.access.view')
  @Get('delegations')
  listDelegations(@Req() req: any) {
    return this.service.listDelegations(req.user.id);
  }

  @RequirePermission('admin.access.delegate')
  @Post('delegations')
  createDelegation(
    @Req() req: any,
    @Body() body: { delegateAdminId?: string; permissionCodes?: string[]; expiresInHours?: number; reason?: string },
  ) {
    return this.service.createDelegation(
      req.user.id,
      String(body.delegateAdminId ?? ''),
      Array.isArray(body.permissionCodes) ? body.permissionCodes : [],
      Number(body.expiresInHours ?? 24),
      String(body.reason ?? ''),
    );
  }

  @RequirePermission('admin.access.delegate')
  @Post('delegations/:delegationId/revoke')
  async revokeDelegation(
    @Req() req: any,
    @Param('delegationId') delegationId: string,
    @Body() body: { reason?: string },
  ) {
    const result = await this.service.revokeDelegation(req.user.id, delegationId, String(body.reason ?? ''));
    if (result.changed) {
      await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, result.delegation.delegateAdminId, 'REVOKE_DELEGATION');
    }
    return result;
  }

  @RequirePermission('admin.create')
  @Post('invitations')
  createInvitation(
    @Req() req: any,
    @Body() body: { email?: string; roleId?: string; expiresInHours?: number },
  ) {
    return this.service.createInvitation(
      req.user.id,
      String(body.email ?? ''),
      String(body.roleId ?? ''),
      Number(body.expiresInHours ?? 24),
    );
  }

  @RequirePermission('admin.access.view')
  @Get('admin-users/:adminUserId/security')
  securityOverview(@Param('adminUserId') adminUserId: string) {
    return this.service.securityOverview(adminUserId);
  }

  @RequirePermission('admin.access.manage')
  @Patch('admin-users/:adminUserId/status')
  changeStatus(
    @Req() req: any,
    @Param('adminUserId') adminUserId: string,
    @Body() body: { status?: string; reason?: string },
  ) {
    return this.accountLifecycle.changeStatus(
      req.user.id,
      adminUserId,
      String(body.status ?? ''),
      String(body.reason ?? ''),
    );
  }

  @RequirePermission('admin.access.manage')
  @Post('admin-users/:adminUserId/roles')
  async assignRole(@Req() req: any, @Param('adminUserId') adminUserId: string, @Body() body: { roleId?: string }) {
    const result = await this.service.assignRole(req.user.id, adminUserId, String(body.roleId ?? ''));
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, adminUserId, 'ASSIGN_ROLE');
    return result;
  }

  @RequirePermission('admin.access.manage')
  @Delete('admin-users/:adminUserId/roles/:roleId')
  async removeRole(@Req() req: any, @Param('adminUserId') adminUserId: string, @Param('roleId') roleId: string) {
    const result = await this.service.removeRole(req.user.id, adminUserId, roleId);
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, adminUserId, 'REMOVE_ROLE');
    return result;
  }
}
