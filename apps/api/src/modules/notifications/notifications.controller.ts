import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsCommandService } from './notifications-command.service';
import { NotificationsQueryService } from './notifications-query.service';

@Controller('member/notifications')
@UseGuards(MemberAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsQuery: NotificationsQueryService,
    private readonly notificationsCommand: NotificationsCommandService,
  ) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notificationsQuery.listMemberNotifications(user.id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: { id: string }) {
    return this.notificationsQuery.getPreferences(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsCommand.markAllRead(user.id);
  }

  @Patch(':notificationKey/read')
  markRead(@CurrentUser() user: { id: string }, @Param('notificationKey') notificationKey: string) {
    return this.notificationsCommand.markRead(user.id, notificationKey);
  }

  @Patch(':notificationKey/archive')
  archive(@CurrentUser() user: { id: string }, @Param('notificationKey') notificationKey: string) {
    return this.notificationsCommand.archive(user.id, notificationKey);
  }

  @Put('preferences')
  updatePreferences(@CurrentUser() user: { id: string }, @Body() body: UpdateNotificationPreferencesDto) {
    return this.notificationsCommand.updatePreferences(user.id, body);
  }
}
