import { Injectable } from '@nestjs/common';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsCommandService } from './notifications-command.service';
import { NotificationsQueryService } from './notifications-query.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsQuery: NotificationsQueryService,
    private readonly notificationsCommand: NotificationsCommandService,
  ) {}

  listMemberNotifications(userId: string) {
    return this.notificationsQuery.listMemberNotifications(userId);
  }

  getPreferences(userId: string) {
    return this.notificationsQuery.getPreferences(userId);
  }

  markAllRead(userId: string) {
    return this.notificationsCommand.markAllRead(userId);
  }

  markRead(userId: string, notificationKey: string) {
    return this.notificationsCommand.markRead(userId, notificationKey);
  }

  archive(userId: string, notificationKey: string) {
    return this.notificationsCommand.archive(userId, notificationKey);
  }

  updatePreferences(userId: string, input: UpdateNotificationPreferencesDto) {
    return this.notificationsCommand.updatePreferences(userId, input);
  }
}
