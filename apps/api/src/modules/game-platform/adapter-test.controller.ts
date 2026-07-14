import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdapterTestService } from './adapter-test.service';
import { AdapterTestRequestDto } from './dto/game-platform-mutation.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-providers/:providerId/adapter-test')
export class AdapterTestController {
  constructor(private readonly adapterTestService: AdapterTestService) {}
  @RequirePermission('game.providers.view') @Get() listMethods(@Param('providerId') providerId: string) { return this.adapterTestService.listMethods(providerId); }
  @RequirePermission('game.providers.manage') @Post(':method') run(@Param('providerId') providerId: string, @Param('method') method: any, @Body() body: AdapterTestRequestDto) { return this.adapterTestService.run(providerId, method, body ?? {}); }
}
