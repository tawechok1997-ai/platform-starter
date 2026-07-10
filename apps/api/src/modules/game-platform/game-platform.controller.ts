import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { GamePlatformService } from './game-platform.service';
import { CreateGameProviderDto, UpdateGameProviderDto, normalizeCreateGameProviderDto, normalizeUpdateGameProviderDto } from './dto/game-provider.dto';
import { CreateGameProviderEndpointDto, UpdateGameProviderEndpointDto, normalizeCreateGameProviderEndpointDto, normalizeUpdateGameProviderEndpointDto } from './dto/game-provider-endpoint.dto';
import { CreateGameProviderCredentialDto, UpdateGameProviderCredentialDto, normalizeCreateGameProviderCredentialDto, normalizeUpdateGameProviderCredentialDto } from './dto/game-provider-credential.dto';
import { CreateGameDto, UpdateGameDto, normalizeCreateGameDto, normalizeUpdateGameDto } from './dto/game-catalog.dto';
import { CreateGameMediaDto, UpdateGameMediaDto, normalizeCreateGameMediaDto, normalizeUpdateGameMediaDto } from './dto/game-media.dto';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin')
export class GamePlatformController {
  constructor(private readonly gamePlatformService: GamePlatformService) {}
  @RequirePermission('game.providers.view') @Get('game-platform/overview') overview() { return this.gamePlatformService.overview(); }
  @RequirePermission('game.providers.view') @Get('game-platform/data-model-plan') dataModelPlan() { return this.gamePlatformService.dataModelPlan(); }
  @RequirePermission('game.providers.view') @Get('game-providers') listProviders() { return this.gamePlatformService.listProviders(); }
  @RequirePermission('game.providers.view') @Get('game-providers/:id') getProvider(@Param('id') id: string) { return this.gamePlatformService.getProvider(id); }
  @RequirePermission('game.providers.manage') @Post('game-providers') createProvider(@Body() body: CreateGameProviderDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.createProvider(normalizeCreateGameProviderDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Patch('game-providers/:id') updateProvider(@Param('id') id: string, @Body() body: UpdateGameProviderDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.updateProvider(id, normalizeUpdateGameProviderDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Post('game-providers/:providerId/sync-games') syncGames(@Param('providerId') providerId: string, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.syncGamesDryRun(providerId, user, this.meta(req)); }
  @RequirePermission('game.providers.view') @Get('games') listGames() { return this.gamePlatformService.listGames(); }
  @RequirePermission('game.providers.view') @Get('games/:id') getGame(@Param('id') id: string) { return this.gamePlatformService.getGame(id); }
  @RequirePermission('game.providers.manage') @Post('games') createGame(@Body() body: CreateGameDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.createGame(normalizeCreateGameDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Patch('games/:id') updateGame(@Param('id') id: string, @Body() body: UpdateGameDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.updateGame(id, normalizeUpdateGameDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Post('games/:gameId/media') createGameMedia(@Param('gameId') gameId: string, @Body() body: CreateGameMediaDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.createGameMedia(gameId, normalizeCreateGameMediaDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Patch('games/:gameId/media/:mediaId') updateGameMedia(@Param('gameId') gameId: string, @Param('mediaId') mediaId: string, @Body() body: UpdateGameMediaDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.updateGameMedia(gameId, mediaId, normalizeUpdateGameMediaDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.view') @Get('game-sessions') listGameSessions() { return this.gamePlatformService.listGameSessions(); }
  @RequirePermission('game.providers.view') @Get('game-sessions/:id') getGameSession(@Param('id') id: string) { return this.gamePlatformService.getGameSession(id); }
  @RequirePermission('game.providers.manage') @Post('game-providers/:providerId/health-check') healthCheckProvider(@Param('providerId') providerId: string, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.healthCheckProvider(providerId, user, this.meta(req)); }
  @RequirePermission('game.providers.view') @Get('game-providers/:providerId/endpoints') listProviderEndpoints(@Param('providerId') providerId: string) { return this.gamePlatformService.listProviderEndpoints(providerId); }
  @RequirePermission('game.providers.manage') @Post('game-providers/:providerId/endpoints') createProviderEndpoint(@Param('providerId') providerId: string, @Body() body: CreateGameProviderEndpointDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.createProviderEndpoint(providerId, normalizeCreateGameProviderEndpointDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Patch('game-providers/:providerId/endpoints/:endpointId') updateProviderEndpoint(@Param('providerId') providerId: string, @Param('endpointId') endpointId: string, @Body() body: UpdateGameProviderEndpointDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.updateProviderEndpoint(providerId, endpointId, normalizeUpdateGameProviderEndpointDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.view') @Get('game-providers/:providerId/credentials') listProviderCredentials(@Param('providerId') providerId: string) { return this.gamePlatformService.listProviderCredentials(providerId); }
  @RequirePermission('game.providers.manage') @Post('game-providers/:providerId/credentials') createProviderCredential(@Param('providerId') providerId: string, @Body() body: CreateGameProviderCredentialDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.createProviderCredential(providerId, normalizeCreateGameProviderCredentialDto(body), user, this.meta(req)); }
  @RequirePermission('game.providers.manage') @Patch('game-providers/:providerId/credentials/:credentialId') updateProviderCredential(@Param('providerId') providerId: string, @Param('credentialId') credentialId: string, @Body() body: UpdateGameProviderCredentialDto, @CurrentUser() user: any, @Req() req: any) { return this.gamePlatformService.updateProviderCredential(providerId, credentialId, normalizeUpdateGameProviderCredentialDto(body), user, this.meta(req)); }
  private meta(req: any) { return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] }; }
}
