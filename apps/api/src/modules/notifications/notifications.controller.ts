import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('member/notifications')
@UseGuards(MemberAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notificationsService.listMemberNotifications(user.id);
  }
}
