import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateRiskWatchlistEntryDto, MatchRiskWatchlistDto, ReleaseRiskWatchlistEntryDto } from './dto/risk-watchlist.dto';
import { RiskWatchlistQueryService } from './risk-watchlist-query.service';
import { RiskWatchlistService } from './risk-watchlist.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/risk-watchlist')
export class RiskWatchlistController {
  constructor(
    private readonly service: RiskWatchlistService,
    private readonly queries: RiskWatchlistQueryService,
  ) {}

  @RequirePermission('risk.view')
  @Get()
  list(
    @Query('status') status?: string,
    @Query('listType') listType?: string,
    @Query('subjectType') subjectType?: string,
    @Query('memberId') memberId?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.queries.list({ status, listType, subjectType, memberId, page, take });
  }

  @RequirePermission('risk.resolve')
  @Post()
  create(@Body() body: CreateRiskWatchlistEntryDto, @CurrentUser() admin: { id: string }) {
    return this.service.create(body, admin);
  }

  @RequirePermission('risk.resolve')
  @Patch(':id/release')
  release(@Param('id') id: string, @Body() body: ReleaseRiskWatchlistEntryDto, @CurrentUser() admin: { id: string }) {
    return this.service.release(id, body, admin);
  }

  @RequirePermission('risk.view')
  @Post('match')
  match(@Body() body: MatchRiskWatchlistDto) {
    return this.queries.match(body);
  }
}
