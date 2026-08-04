import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AdminRequestContext } from '../../common/actors';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAccessGovernanceService } from './admin-access-governance.service';
import { AdminAccessSessionService } from './admin-access-session.service';
import { AdminAccessService } from './admin-access.service';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';
import { AdminOwnershipCommandService } from './admin-ownership-command.service';
import { AdminRoleAssignmentService } from './admin-role-assignment.service';
import {
  AssignAdminRoleDto,
  ChangeAdminStatusDto,
  CreateAdminInvitationDto,
  CreateAdminTeamDto,
  CreateDelegationDto,
  PreviewAdminRoleSelectionDto,
  ReasonDto,
  SetAdminPermissionOverrideDto,
  SetAdminReportingLineDto,
  SetAdminTeamMemberDto,
  SyncAdminRolesDto,
  TransferOwnershipDto,
  UpdateAdminAccessProfileDto,
  UpdateAdminTeamDto,
} from './dto/admin-access.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access')
export class AdminAccessController {
  constructor(
    private readonly service: AdminAccessService,
    private readonly accessSessions: AdminAccessSessionService,
    private readonly accountLifecycle: AdminAccountLifecycleService,
    private readonly invitationCommands: AdminInvitationAdminService,
    private readonly ownershipCommands: AdminOwnershipCommandService,
    private readonly roleAssignments: AdminRoleAssignmentService,
    private readonly governance: AdminAccessGovernanceService,
  ) {}

  @RequirePermission('admin.access.view')
  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @RequirePermission('admin.access.view')
  @Post('role-preview')
  previewRoles(
    @Req() req: AdminRequestContext,
    @Body() body: PreviewAdminRoleSelectionDto,
  ) {
    return this.roleAssignments.preview(req.user.id, body.roleIds, body.primaryRoleId);
  }

  @RequirePermission('admin.teams.view')
  @Get('teams')
  teamOverview() {
    return this.governance.overview();
  }

  @RequirePermission('admin.teams.manage')
  @Post('teams')
  createTeam(@Req() req: AdminRequestContext, @Body() body: CreateAdminTeamDto) {
    return this.governance.createTeam(req.user.id, body);
  }

  @RequirePermission('admin.teams.manage')
  @Patch('teams/:teamId')
  updateTeam(
    @Req() req: AdminRequestContext,
    @Param('teamId') teamId: string,
    @Body() body: UpdateAdminTeamDto,
  ) {
    return this.governance.updateTeam(req.user.id, teamId, body);
  }

  @RequirePermission('admin.teams.manage')
  @Post('teams/:teamId/members')
  async setTeamMember(
    @Req() req: AdminRequestContext,
    @Param('teamId') teamId: string,
    @Body() body: SetAdminTeamMemberDto,
  ) {
    const result = await this.governance.setTeamMember(
      req.user.id,
      teamId,
      body.adminUserId,
      body.isLead,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      body.adminUserId,
      'SET_TEAM_MEMBER',
    );
    return result;
  }

  @RequirePermission('admin.teams.manage')
  @Delete('teams/:teamId/members/:adminUserId')
  async removeTeamMember(
    @Req() req: AdminRequestContext,
    @Param('teamId') teamId: string,
    @Param('adminUserId') adminUserId: string,
  ) {
    const result = await this.governance.removeTeamMember(
      req.user.id,
      teamId,
      adminUserId,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'REMOVE_TEAM_MEMBER',
    );
    return result;
  }

  @RequirePermission('admin.access.view')
  @Get('admin-users/:adminUserId/effective-access')
  effectiveAccess(@Param('adminUserId') adminUserId: string) {
    return this.governance.effectiveAccess(adminUserId);
  }

  @RequirePermission('admin.subordinates.manage')
  @Patch('admin-users/:adminUserId/reporting-line')
  async setReportingLine(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: SetAdminReportingLineDto,
  ) {
    const result = await this.governance.setReportingLine(
      req.user.id,
      adminUserId,
      body.managerAdminId,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'SET_REPORTING_LINE',
    );
    return result;
  }

  @RequirePermission('admin.permissions.override')
  @Patch('admin-users/:adminUserId/permission-overrides')
  async setPermissionOverride(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: SetAdminPermissionOverrideDto,
  ) {
    const result = await this.governance.upsertPermissionOverride(
      req.user.id,
      adminUserId,
      body.permissionCode,
      body.effect,
      body.reason,
      body.expiresAt,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'SET_PERMISSION_OVERRIDE',
    );
    return result;
  }

  @RequirePermission('admin.permissions.override')
  @Delete('admin-users/:adminUserId/permission-overrides/:permissionCode')
  async deletePermissionOverride(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Param('permissionCode') permissionCode: string,
  ) {
    const result = await this.governance.deletePermissionOverride(
      req.user.id,
      adminUserId,
      permissionCode,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'DELETE_PERMISSION_OVERRIDE',
    );
    return result;
  }

  @RequirePermission('admin.access.manage')
  @Patch('admin-users/:adminUserId/access-profile')
  async updateAccessProfile(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: UpdateAdminAccessProfileDto,
  ) {
    const result = await this.governance.updateAccessProfile(
      req.user.id,
      adminUserId,
      body.scope,
      body.approvalLimits,
      body.reason,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'UPDATE_ACCESS_PROFILE',
    );
    return result;
  }

  @RequirePermission('admin.access.manage')
  @Post('ownership-transfer')
  async transferOwnership(
    @Req() req: AdminRequestContext,
    @Body() body: TransferOwnershipDto,
  ) {
    const result = await this.ownershipCommands.transferOwnership(
      req.user.id,
      req.user.sessionId,
      body.targetAdminId,
      body.twoFactorCode,
      body.reason,
      {
        ipAddress: req.ip,
        userAgent: req.headers?.['user-agent'] as string | undefined,
      },
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      req.user.id,
      'TRANSFER_OWNERSHIP_OUT',
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      result.newOwnerId,
      'TRANSFER_OWNERSHIP_IN',
    );
    return result;
  }

  @RequirePermission('admin.access.view')
  @Get('delegations')
  listDelegations(@Req() req: AdminRequestContext) {
    return this.service.listDelegations(req.user.id);
  }

  @RequirePermission('admin.access.delegate')
  @Post('delegations')
  createDelegation(
    @Req() req: AdminRequestContext,
    @Body() body: CreateDelegationDto,
  ) {
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
    const result = await this.service.revokeDelegation(
      req.user.id,
      delegationId,
      body.reason,
    );
    if (result.changed) {
      await this.accessSessions.revokeAfterPrivilegeChange(
        req.user.id,
        result.delegation.delegateAdminId,
        'REVOKE_DELEGATION',
      );
    }
    return result;
  }

  @RequirePermission('admin.create')
  @Post('invitations')
  createInvitation(
    @Req() req: AdminRequestContext,
    @Body() body: CreateAdminInvitationDto,
  ) {
    const roleIds = body.roleIds?.length
      ? body.roleIds
      : body.roleId
        ? [body.roleId]
        : [];
    return this.invitationCommands.create(
      req.user.id,
      body.email,
      roleIds,
      body.expiresInHours,
      {
        primaryRoleId: body.primaryRoleId,
        department: body.department,
      },
    );
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
    return this.service.revokeAdminSession(
      req.user.id,
      adminUserId,
      sessionId,
      body.reason,
    );
  }

  @RequirePermission('admin.access.manage')
  @Patch('admin-users/:adminUserId/status')
  changeStatus(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: ChangeAdminStatusDto,
  ) {
    return this.accountLifecycle.changeStatus(
      req.user.id,
      adminUserId,
      body.status,
      body.reason,
    );
  }

  @RequirePermission('admin.access.manage')
  @Patch('admin-users/:adminUserId/roles')
  async syncRoles(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: SyncAdminRolesDto,
  ) {
    const result = await this.roleAssignments.syncRoles(
      req.user.id,
      adminUserId,
      body.roleIds,
      body.primaryRoleId,
      body.reason,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'SYNC_ROLES',
    );
    return result;
  }

  @RequirePermission('admin.access.manage')
  @Post('admin-users/:adminUserId/roles')
  async assignRole(
    @Req() req: AdminRequestContext,
    @Param('adminUserId') adminUserId: string,
    @Body() body: AssignAdminRoleDto,
  ) {
    const reason = body.reason ?? 'Role assigned by administrator';
    const result = await this.service.assignRole(
      req.user.id,
      adminUserId,
      body.roleId,
      reason,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'ASSIGN_ROLE',
    );
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
    const result = await this.service.removeRole(
      req.user.id,
      adminUserId,
      roleId,
      body.reason,
    );
    await this.accessSessions.revokeAfterPrivilegeChange(
      req.user.id,
      adminUserId,
      'REMOVE_ROLE',
    );
    return result;
  }
}
