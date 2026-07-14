import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationFeedReadRepository } from './notification-feed-read.repository';
import {
  DEFAULT_CATEGORIES,
  NotificationItem,
  NotificationType,
  channelSettingKey,
  money,
  normalizeChannels,
  statusLabel,
  topUpTitle,
  withdrawalTitle,
} from './notification.mapper';

@Injectable()
export class NotificationsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedRepository: NotificationFeedReadRepository,
  ) {}

  async listMemberNotifications(userId: string) {
    const [topUps, withdrawals, supportTickets, loginHistory] = await this.feedRepository.loadMemberFeedSources(userId);

    const items: NotificationItem[] = [
      ...topUps.map((item) => ({
        id: `topup:${item.id}:${item.status}`,
        title: topUpTitle(item.status),
        description: `รายการฝาก ${money(item.amount.toString(), item.currency)} มีสถานะ ${statusLabel(item.status)}`,
        type: 'finance' as const,
        createdAt: item.updatedAt,
        href: '/transactions',
      })),
      ...withdrawals.map((item) => ({
        id: `withdrawal:${item.id}:${item.status}`,
        title: withdrawalTitle(item.status),
        description: `รายการถอนเงิน ${money(item.amount.toString(), item.currency)} มีสถานะ ${statusLabel(item.status)}`,
        type: 'finance' as const,
        createdAt: item.updatedAt,
        href: '/transactions',
      })),
      ...supportTickets.map((item) => ({
        id: `support:${item.id}:${item.status}`,
        title: `Ticket: ${item.title}`,
        description: `สถานะล่าสุด ${statusLabel(item.status)}`,
        type: 'system' as const,
        createdAt: item.updatedAt,
        href: '/support',
      })),
      ...loginHistory.map((item) => ({
        id: `login:${item.id}`,
        title: item.success ? 'มีการเข้าสู่ระบบบัญชี' : 'พบความพยายามเข้าสู่ระบบไม่สำเร็จ',
        description: item.success
          ? `เข้าสู่ระบบจาก IP ${item.ipAddress ?? 'ไม่ทราบ'}`
          : `ความพยายามเข้าสู่ระบบจาก IP ${item.ipAddress ?? 'ไม่ทราบ'}${item.reason ? ` (${item.reason})` : ''}`,
        type: 'security' as const,
        createdAt: item.createdAt,
        href: '/profile/security',
      })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const [states, preferenceBundle] = await Promise.all([
      this.prisma.notificationState.findMany({
        where: { userId, notificationKey: { in: items.map((item) => item.id) } },
        select: { notificationKey: true, readAt: true, archivedAt: true },
      }),
      this.getPreferences(userId),
    ]);

    const stateByKey = new Map(states.map((state) => [state.notificationKey, state]));
    const visibleItems = items.filter(
      (item) => preferenceBundle.preferences.categories[item.type] !== false && !stateByKey.get(item.id)?.archivedAt,
    );
    const limited = visibleItems.slice(0, 50).map((item) => {
      const state = stateByKey.get(item.id);
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        isRead: Boolean(state?.readAt),
        readAt: state?.readAt?.toISOString() ?? null,
      };
    });
    const groups = limited.reduce<Record<string, typeof limited>>((acc, item) => {
      const day = item.createdAt.slice(0, 10);
      (acc[day] ??= []).push(item);
      return acc;
    }, {});

    return {
      items: limited,
      groups,
      total: limited.length,
      counts: limited.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {} as Record<NotificationType, number>),
      preferences: preferenceBundle.preferences,
    };
  }

  async getPreferences(userId: string) {
    const [categoryPreference, channelSetting] = await Promise.all([
      this.prisma.notificationPreference.findUnique({
        where: { userId },
        select: { finance: true, security: true, promotion: true, system: true },
      }),
      this.prisma.siteSetting.findUnique({
        where: { key: channelSettingKey(userId) },
        select: { valueJson: true },
      }),
    ]);

    return {
      preferences: {
        categories: categoryPreference ?? DEFAULT_CATEGORIES,
        channels: normalizeChannels(channelSetting?.valueJson),
      },
    };
  }
}
