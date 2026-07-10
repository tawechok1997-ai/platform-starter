import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminMembersService } from './admin-members.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/members')
export class AdminMembersController {
  constructor(private readonly adminMembersService: AdminMembersService) {}

  @RequirePermission('users.view')
  @Get()
  listMembers(@Query('search') search?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('take') take?: string) {
    return this.adminMembersService.listMembers({ search, status, page, take });
  }

  @RequirePermission('users.view')
  @Get(':id')
  getMemberDetail(@Param('id') id: string) {
    return this.adminMembersService.getMemberDetail(id);
  }

  @RequirePermission('users.suspend')
  @Patch(':id/status')
  updateMemberStatus(@Param('id') id: string, @Body() body: { status?: string; reason?: string }, @CurrentUser() admin: any, @Req() req: any) {
    return this.adminMembersService.updateMemberStatus(id, body.status, body.reason, admin, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
