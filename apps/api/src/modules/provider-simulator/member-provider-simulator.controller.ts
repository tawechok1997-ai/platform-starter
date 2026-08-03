import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { MemberActor, MemberRequestContext } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { MemberSimulatorSlotSpinDto } from './dto/member-simulator-slot-spin.dto';
import { ProviderSimulatorSlotService } from './provider-simulator-slot.service';

@UseGuards(MemberAuthGuard)
@Controller('member/provider-simulator')
export class MemberProviderSimulatorController {
  constructor(private readonly slotService: ProviderSimulatorSlotService) {}

  @Post('games/demo-slot-001/launch')
  launch(@CurrentUser() member: MemberActor, @Req() request: MemberRequestContext) {
    const userAgent = request.headers?.['user-agent'];
    return this.slotService.launch({
      userId: member.id,
      ipAddress: request.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    });
  }

  @Post('sessions/:sessionId/spin')
  spin(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @CurrentUser() member: MemberActor,
    @Body() body: MemberSimulatorSlotSpinDto,
  ) {
    return this.slotService.spin({
      userId: member.id,
      sessionId,
      spinId: body.spinId,
      amount: body.amount,
    });
  }
}
