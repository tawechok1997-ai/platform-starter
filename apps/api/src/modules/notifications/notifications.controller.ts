import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@Controller('member/notifications')
@UseGuards(MemberAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notificationsService.listMemberNotifications(user.id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':notificationKey/read')
  markRead(@CurrentUser() user: { id: string }, @Param('notificationKey') notificationKey: string) {
    return this.notificationsService.markRead(user.id, notificationKey);
  }

  @Patch(':notificationKey/archive')
  archive(@CurrentUser() user: { id: string }, @Param('notificationKey') notificationKey: string) {
    return this.notificationsService.archive(user.id, notificationKey);
  }

  @Put('preferences')
  updatePreferences(@CurrentUser() user: { id: string }, @Body() body: UpdateNotificationPreferencesDto) {
    return this.notificationsService.updatePreferences(user.id, body);
  }
}
