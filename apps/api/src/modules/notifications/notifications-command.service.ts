import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  NotificationCategories,
  NotificationChannels,
  channelSettingKey,
} from './notification.mapper';
import { NotificationsQueryService } from './notifications-query.service';

@Injectable()
export class NotificationsCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsQuery: NotificationsQueryService,
  ) {}

  async markAllRead(userId: string) {
    const current = await this.notificationsQuery.listMemberNotifications(userId);
    const now = new Date();
    await this.prisma.$transaction(
      current.items.map((item) =>
        this.prisma.notificationState.upsert({
          where: { userId_notificationKey: { userId, notificationKey: item.id } },
          update: { readAt: now },
          create: { userId, notificationKey: item.id, readAt: now },
        }),
      ),
    );
    return { success: true, marked: current.items.length };
  }

  async markRead(userId: string, notificationKey: string) {
    const readAt = new Date();
    await this.prisma.notificationState.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { readAt },
      create: { userId, notificationKey, readAt },
    });
    return { success: true, notificationKey, isRead: true };
  }

  async archive(userId: string, notificationKey: string) {
    const archivedAt = new Date();
    await this.prisma.notificationState.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { archivedAt },
      create: { userId, notificationKey, archivedAt },
    });
    return { success: true, notificationKey, archived: true };
  }

  async updatePreferences(userId: string, input: UpdateNotificationPreferencesDto) {
    const current = await this.notificationsQuery.getPreferences(userId);
    const categories: NotificationCategories = {
      finance: input.finance ?? current.preferences.categories.finance,
      security: input.security ?? current.preferences.categories.security,
      promotion: input.promotion ?? current.preferences.categories.promotion,
      system: input.system ?? current.preferences.categories.system,
    };
    const channels: NotificationChannels = {
      email: input.email ?? current.preferences.channels.email,
      sms: input.sms ?? current.preferences.channels.sms,
      push: input.push ?? current.preferences.channels.push,
    };

    await this.prisma.$transaction([
      this.prisma.notificationPreference.upsert({
        where: { userId },
        update: categories,
        create: { userId, ...categories },
      }),
      this.prisma.siteSetting.upsert({
        where: { key: channelSettingKey(userId) },
        update: { valueJson: channels },
        create: {
          key: channelSettingKey(userId),
          valueJson: channels,
          group: 'FEATURES',
          type: 'JSON',
          isPublic: false,
          isSensitive: false,
        },
      }),
    ]);

    return { preferences: { categories, channels } };
  }
}
