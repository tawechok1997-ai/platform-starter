import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { MemberSimulatorSlotSpinDto } from './dto/member-simulator-slot-spin.dto';
import { ProviderSimulatorSlotService } from './provider-simulator-slot.service';

@UseGuards(MemberAuthGuard)
@Controller('member/provider-simulator')
export class MemberProviderSimulatorController {
  constructor(private readonly slotService: ProviderSimulatorSlotService) {}

  @Post('sessions/:sessionId/spin')
  spin(
    @Param('sessionId') sessionId: string,
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
