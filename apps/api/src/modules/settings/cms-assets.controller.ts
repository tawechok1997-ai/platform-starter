import { Body, Controller, Delete, Get, Header, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CmsAssetsService } from './cms-assets.service';
import { DeleteCmsAssetDto, UploadCmsAssetDto } from './cms-assets.dto';

@Controller()
export class CmsAssetsController {
  constructor(private readonly cmsAssets: CmsAssetsService) {}

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('settings.features.update')
  @Post('admin/settings/cms-assets')
  upload(@Body() body: UploadCmsAssetDto, @CurrentUser() user: any, @Req() req: any) {
    return this.cmsAssets.upload(body, user, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('settings.features.update')
  @Delete('admin/settings/cms-assets')
  remove(@Body() body: DeleteCmsAssetDto, @CurrentUser() user: any, @Req() req: any) {
    return this.cmsAssets.remove(body.storageKey, user, this.meta(req));
  }

  @Get('public/cms-assets/:fileName')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async read(@Param('fileName') fileName: string, @Res() response: any) {
    const stored = await this.cmsAssets.readPublic(fileName);
    response.type(stored.contentType).send(stored.data);
  }

  private meta(req: any) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
