import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAccessService } from './admin-access.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access')
export class AdminAccessController {
  constructor(private readonly service: AdminAccessService) {}

  @RequirePermission('admin.access.view')
  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @RequirePermission('admin.access.manage')
  @Post('admin-users/:adminUserId/roles')
  assignRole(@Req() req: any, @Param('adminUserId') adminUserId: string, @Body() body: { roleId?: string }) {
    return this.service.assignRole(req.user.id, adminUserId, String(body.roleId ?? ''));
  }

  @RequirePermission('admin.access.manage')
  @Delete('admin-users/:adminUserId/roles/:roleId')
  removeRole(@Req() req: any, @Param('adminUserId') adminUserId: string, @Param('roleId') roleId: string) {
    return this.service.removeRole(req.user.id, adminUserId, roleId);
  }
}
