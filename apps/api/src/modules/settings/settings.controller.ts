import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { SettingsService } from './settings.service';

type SettingsUpdateRequest = Record<string, unknown>;

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public/site-settings') getPublicSettings() { return this.settingsService.getPublicSettings(); }
  @Get('public/theme') getPublicTheme() { return this.settingsService.getPublicSettings('theme'); }
  @Get('public/seo') getPublicSeo() { return this.settingsService.getPublicSettings('seo'); }
  @Get('public/contact') getPublicContact() { return this.settingsService.getPublicSettings('contact'); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.website.view') @Get('admin/settings/website')
  getWebsite() { return this.settingsService.getAdminGroup('website'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.website.update') @Put('admin/settings/website')
  updateWebsite(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('website', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.branding.view') @Get('admin/settings/branding')
  getBranding() { return this.settingsService.getAdminGroup('branding'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.branding.update') @Put('admin/settings/branding')
  updateBranding(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('branding', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.theme.view') @Get('admin/settings/theme')
  getTheme() { return this.settingsService.getAdminGroup('theme'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.theme.update') @Put('admin/settings/theme')
  updateTheme(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('theme', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.seo.view') @Get('admin/settings/seo')
  getSeo() { return this.settingsService.getAdminGroup('seo'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.seo.update') @Put('admin/settings/seo')
  updateSeo(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('seo', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.contact.view') @Get('admin/settings/contact')
  getContact() { return this.settingsService.getAdminGroup('contact'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.contact.update') @Put('admin/settings/contact')
  updateContact(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('contact', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.maintenance.view') @Get('admin/settings/maintenance')
  getMaintenance() { return this.settingsService.getAdminGroup('maintenance'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.maintenance.update') @Put('admin/settings/maintenance')
  updateMaintenance(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('maintenance', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.scripts.view') @Get('admin/settings/scripts')
  getScripts() { return this.settingsService.getAdminGroup('scripts'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.scripts.update') @Put('admin/settings/scripts')
  updateScripts(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('scripts', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.features.view') @Get('admin/settings/features')
  getFeatures() { return this.settingsService.getAdminGroup('features'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.features.update') @Put('admin/settings/features')
  updateFeatures(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('features', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.legal.view') @Get('admin/settings/legal')
  getLegal() { return this.settingsService.getAdminGroup('legal'); }
  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.legal.update') @Put('admin/settings/legal')
  updateLegal(@Body() body: SettingsUpdateRequest, @CurrentUser() user: AuthenticatedAdminActor, @Req() req: AdminRequestContext) { return this.update('legal', body, user, req); }

  @UseGuards(AdminAuthGuard, PermissionsGuard) @RequirePermission('settings.website.view') @Get('admin/settings/:group')
  getGroup(@Param('group') group: string) { return this.settingsService.getAdminGroup(group); }

  private update(group: string, body: SettingsUpdateRequest, user: AuthenticatedAdminActor, req: AdminRequestContext) {
    return this.settingsService.updateAdminGroup(group, body, user, this.meta(req));
  }

  private meta(req: AdminRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}
