import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { GameSessionLifecycleService } from './game-session-lifecycle.service';

class IssueGameSessionTokenDto {
  ttlMs?: number;
}

class HeartbeatGameSessionDto {
  token?: string;
}

class CloseGameSessionDto {
  reason?: string;
}

@UseGuards(MemberAuthGuard)
@Controller('member/game-sessions')
export class MemberGameSessionController {
  constructor(private readonly lifecycle: GameSessionLifecycleService) {}

  @Post(':sessionId/token')
  issueToken(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: MemberActor,
    @Body() body: IssueGameSessionTokenDto,
  ) {
    return this.lifecycle.issueForMember(sessionId, user.id, body.ttlMs);
  }

  @Post(':sessionId/heartbeat')
  heartbeat(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: MemberActor,
    @Body() body: HeartbeatGameSessionDto,
  ) {
    return this.lifecycle.heartbeat(sessionId, user.id, String(body.token ?? ''));
  }

  @Post(':sessionId/revoke')
  revoke(@Param('sessionId') sessionId: string, @CurrentUser() user: MemberActor) {
    return this.lifecycle.revoke(sessionId, user.id);
  }

  @Post(':sessionId/close')
  close(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: MemberActor,
    @Body() body: CloseGameSessionDto,
  ) {
    return this.lifecycle.close(sessionId, user.id, body.reason);
  }
}
