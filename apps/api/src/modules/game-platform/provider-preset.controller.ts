import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ApplyProviderPresetDto } from './dto/game-platform-mutation.dto';
import { ProviderPresetService } from './provider-preset.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/provider-presets')
export class ProviderPresetController {
  constructor(private readonly providerPresetService: ProviderPresetService) {}
  @RequirePermission('game.providers.view') @Get() listPresets() { return this.providerPresetService.listPresets(); }
  @RequirePermission('game.providers.manage') @Post('apply') applyPreset(@Body() body: ApplyProviderPresetDto, @CurrentUser() user: any, @Req() req: any) { return this.providerPresetService.applyPreset(body, user, { ipAddress: req.ip, userAgent: Array.isArray(req.headers?.['user-agent']) ? req.headers['user-agent'][0] : req.headers?.['user-agent'] }); }
}
