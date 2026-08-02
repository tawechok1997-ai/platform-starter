import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { LotteryNumberRequest } from './activity-requests.dto';
import { MemberActivitiesService } from './member-activities.service';

@Controller()
export class MemberActivitiesController {
  constructor(private readonly service: MemberActivitiesService) {}

  @Get('public/activities')
  listPublicActivities() {
    return this.service.listPublicActivities();
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/activities/overview')
  getOverview(@CurrentUser() user: MemberActor) {
    return this.service.getMemberOverview(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/activities/daily-login')
  getDailyLogin(@CurrentUser() user: MemberActor) {
    return this.service.getDailyLogin(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/activities/daily-login/claim')
  claimDailyLogin(@CurrentUser() user: MemberActor) {
    return this.service.claimDailyLogin(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/activities/missions')
  getMissions(@CurrentUser() user: MemberActor) {
    return this.service.getMissions(user.id);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/activities/missions/:missionCode/claim')
  claimMission(@CurrentUser() user: MemberActor, @Param('missionCode') missionCode: string) {
    return this.service.claimMission(user.id, missionCode);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/activities/turnover')
  getTurnover(@CurrentUser() user: MemberActor, @Query('category') category = 'slot') {
    return this.service.getTurnover(user.id, category);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/activities/turnover/:category/:tierCode/claim')
  claimTurnover(
    @CurrentUser() user: MemberActor,
    @Param('category') category: string,
    @Param('tierCode') tierCode: string,
  ) {
    return this.service.claimTurnover(user.id, category, tierCode);
  }

  @UseGuards(MemberAuthGuard)
  @Get('member/activities/lottery')
  getLottery(@CurrentUser() user: MemberActor, @Query('roundCode') roundCode?: string) {
    return this.service.getLotteryRound(user.id, roundCode);
  }

  @UseGuards(MemberAuthGuard)
  @Post('member/activities/lottery/:roundCode/entries')
  submitLottery(
    @CurrentUser() user: MemberActor,
    @Param('roundCode') roundCode: string,
    @Body() body: LotteryNumberRequest,
  ) {
    return this.service.submitLotteryEntry(user.id, roundCode, body);
  }
}
