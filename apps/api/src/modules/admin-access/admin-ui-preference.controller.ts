import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext } from '../../common/actors';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { UpdateAdminUiPreferenceDto } from './dto/admin-ui-preference.dto';
import { AdminUiPreferenceService } from './admin-ui-preference.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/preferences')
export class AdminUiPreferenceController {
  constructor(private readonly preferences: AdminUiPreferenceService) {}

  @Get(':key')
  getPreference(@Req() req: AdminRequestContext, @Param('key') key: string) {
    return this.preferences.get(req.user.id, key);
  }

  @Patch(':key')
  updatePreference(
    @Req() req: AdminRequestContext,
    @Param('key') key: string,
    @Body() body: UpdateAdminUiPreferenceDto,
  ) {
    return this.preferences.upsert(req.user.id, key, body.value);
  }
}
