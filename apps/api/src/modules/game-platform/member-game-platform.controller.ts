import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { MemberActor, MemberRequestContext } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { GamePlatformService } from './game-platform.service';

@UseGuards(MemberAuthGuard)
@Controller('member')
export class MemberGamePlatformController {
  constructor(private readonly gamePlatformService: GamePlatformService) {}

  @Get('games')
  listGames() {
    return this.gamePlatformService.listMemberGames();
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
