import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateGameTournamentDto, UpdateGameTournamentDto, normalizeCreateGameTournamentDto, normalizeUpdateGameTournamentDto } from './dto/game-tournament.dto';
import { GameTournamentService } from './game-tournament.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-tournaments')
export class AdminGameTournamentController {
  constructor(private readonly tournaments: GameTournamentService) {}

  @RequirePermission('game.providers.view')
  @Get()
  list() {
    return this.tournaments.listAdmin();
  }

  @RequirePermission('game.providers.manage')
  @Post()
  create(@Body() body: CreateGameTournamentDto, @CurrentUser() actor: AuthenticatedAdminActor, @Req() request: AdminRequestContext) {
    return this.tournaments.create(normalizeCreateGameTournamentDto(body), actor, this.meta(request));
  }

  @RequirePermission('game.providers.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateGameTournamentDto, @CurrentUser() actor: AuthenticatedAdminActor, @Req() request: AdminRequestContext) {
    return this.tournaments.update(id, normalizeUpdateGameTournamentDto(body), actor, this.meta(request));
  }

  @RequirePermission('game.providers.manage')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedAdminActor, @Req() request: AdminRequestContext) {
    return this.tournaments.remove(id, actor, this.meta(request));
  }

  @RequirePermission('game.providers.view')
  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string, @Query('refresh') refresh?: string) {
    return this.tournaments.getAdminLeaderboard(id, refresh === '1' || refresh === 'true');
  }

  @RequirePermission('game.providers.manage')
  @Post(':id/radar-run')
  runRadar(@Param('id') id: string, @CurrentUser() actor: AuthenticatedAdminActor, @Req() request: AdminRequestContext) {
    return this.tournaments.recalculate(id, actor, this.meta(request), 'manual');
  }

  @RequirePermission('game.providers.manage')
  @Post('radar/run-due')
  runDueRadar() {
    return this.tournaments.runDueRadarTournaments();
  }

  private meta(request: AdminRequestContext) {
    const userAgent = request.headers?.['user-agent'];
    return { ipAddress: request.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}

@Controller('games/tournaments')
export class PublicGameTournamentController {
  constructor(private readonly tournaments: GameTournamentService) {}

  @Get()
  list() {
    return this.tournaments.listPublic();
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.tournaments.getPublicLeaderboard(id);
  }
}
