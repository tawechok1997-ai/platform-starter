import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
  launchGame(@Param('gameId') gameId: string, @CurrentUser() user: any, @Req() req: any) {
    return this.gamePlatformService.launchMemberGame(gameId, user, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
