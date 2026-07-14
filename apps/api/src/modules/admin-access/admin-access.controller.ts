import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext } from '../../common/actors';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAccessSessionService } from './admin-access-session.service';
import { AdminAccessService } from './admin-access.service';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';
import { AdminOwnershipCommandService } from './admin-ownership-command.service';
import {
  AssignAdminRoleDto,
  ChangeAdminStatusDto,
  CreateAdminInvitationDto,
  CreateDelegationDto,
  ReasonDto,
  TransferOwnershipDto,
} from './dto/admin-access.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access')
export class AdminAccessController {
  constructor(
    private readonly service: AdminAccessService,
    private readonly accessSessions: AdminAccessSessionService,
    private readonly accountLifecycle: AdminAccountLifecycleService,
    private readonly ownershipCommands: AdminOwnershipCommandService,
  ) {}

  @RequirePermission('admin.access.view')
  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @RequirePermission('admin.access.manage')
  @Post('ownership-transfer')
  async transferOwnership(@Req() req: AdminRequestContext, @Body() body: TransferOwnershipDto) {
    const result = await this.ownershipCommands.transferOwnership(
      req.user.id,
      body.targetAdminId,
      body.twoFactorCode,
      body.reason,
      { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] as string | undefined },
    );
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, req.user.id, 'TRANSFER_OWNERSHIP_OUT');
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, result.newOwnerId, 'TRANSFER_OWNERSHIP_IN');
    return result;
  }

  @RequirePermission('admin.access.view')
  @Get('delegations')
  listDelegations(@Req() req: AdminRequestContext) {
    return this.service.listDelegations(req.user.id);
  }

  @RequirePermission('admin.access.delegate')
  @Post('delegations')
  createDelegation(@Req() req: AdminRequestContext, @Body() body: CreateDelegationDto) {
    return this.service.createDelegation(
      req.user.id,
      body.delegateAdminId,
      body.permissionCodes,
      body.expiresInHours,
      body.reason,
    );
  }

  @RequirePermission('admin.access.delegate')
  @Post('delegations/:delegationId/revoke')
  async revokeDelegation(
    @Req() req: AdminRequestContext,
    @Param('delegationId') delegationId: string,
    @Body() body: ReasonDto,
  ) {
    const result = await this.service.revokeDelegation(req.user.id, delegationId, body.reason);
    if (result.changed) {
      await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, result.delegation.delegateAdminId, 'REVOKE_DELEGATION');
    }
    return result;
  }

  @RequirePermission('admin.create')
  @Post('invitations')
  createInvitation(@Req() req: AdminRequestContext, @Body() body: CreateAdminInvitationDto) {
    return this.service.createInvitation(req.user.id, body.email, body.roleId, body.expiresInHours);
  }

  @RequirePermission('admin.access.view')
  @Get('owner-recovery-status')
  ownerRecoveryStatus(@Req() req: AdminRequestContext) {
    return this.service.ownerRecoveryStatus(req.user.id);
  }

  @RequirePermission('admin.access.view')
  @Get('admin-users/:adminUserId/security')
  securityOverview(@Param('adminUserId') adminUserId: string) {
    return this.service.securityOverview(adminUserId);
  }

  @RequirePermission('admin.access.manage')
  @Delete('admin-users/:adminUserId/sessions/:sessionId')
  revokeAdminSession(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: ReasonDto,
  ) {
    return this.service.revokeAdminSession(req.user.id, adminUserId, sessionId, body.reason);
  }

  @RequirePermission('admin.access.manage')
  @Patch('admin-users/:adminUserId/status')
  changeStatus(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: ChangeAdminStatusDto,
  ) {
    return this.accountLifecycle.changeStatus(req.user.id, adminUserId, body.status, body.reason);
  }

  @RequirePermission('admin.access.manage')
  @Post('admin-users/:adminUserId/roles')
  async assignRole(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: AssignAdminRoleDto,
  ) {
    const reason = body.reason ?? 'Role assigned by administrator';
    const result = await this.service.assignRole(req.user.id, adminUserId, body.roleId, reason);
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, adminUserId, 'ASSIGN_ROLE');
    return result;
  }

  @RequirePermission('admin.access.manage')
  @Delete('admin-users/:adminUserId/roles/:roleId')
  async removeRole(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Param('roleId') roleId: string,
    @Body() body: ReasonDto,
  ) {
    const result = await this.service.removeRole(req.user.id, adminUserId, roleId, body.reason);
    await this.accessSessions.revokeAfterPrivilegeChange(req.user.id, adminUserId, 'REMOVE_ROLE');
    return result;
  }
}
