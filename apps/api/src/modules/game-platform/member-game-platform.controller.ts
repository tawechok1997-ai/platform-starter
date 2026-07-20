import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { MemberActor, MemberRequestContext } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { GamePlatformService } from './game-platform.service';
import { MemberGameCatalogQuery, MemberGameCatalogService } from './member-game-catalog.service';

@UseGuards(MemberAuthGuard)
@Controller('member')
export class MemberGamePlatformController {
  constructor(
    private readonly gamePlatformService: GamePlatformService,
    private readonly memberGameCatalogService: MemberGameCatalogService,
  ) {}

  @Get('games')
  listGames(@Query() query: MemberGameCatalogQuery) {
    return this.memberGameCatalogService.list(query);
  }

  @Post('games/:gameId/launch')
  launchGame(@Param('gameId') gameId: string, @CurrentUser() user: MemberActor, @Req() req: MemberRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return this.gamePlatformService.launchMemberGame(gameId, user, {
      ipAddress: req.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    });
  }
}
