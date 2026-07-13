import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
type NotificationChannels = { email: boolean; sms: boolean; push: boolean };
type NotificationCategories = Record<NotificationType, boolean>;
type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: Date;
  href?: string;
  isRead?: boolean;
  readAt?: string | null;
};

const DEFAULT_CATEGORIES: NotificationCategories = {
  finance: true,
  security: true,
  promotion: true,
  system: true,
};

const DEFAULT_CHANNELS: NotificationChannels = {
  email: true,
  sms: false,
  push: true,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemberNotifications(userId: string) {
    const [topUps, withdrawals, supportTickets, loginHistory] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, amount: true, currency: true, status: true, updatedAt: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, amount: true, currency: true, status: true, updatedAt: true },
      }),
      this.prisma.riskAlert.findMany({
        where: { memberId: userId, refType: 'SUPPORT_TICKET' },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      this.prisma.loginHistory.findMany({
        where: { userId, type: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, success: true, ipAddress: true, reason: true, createdAt: true },
      }),
    ]);

    const items: NotificationItem[] = [
      ...topUps.map((item) => ({
        id: `topup:${item.id}:${item.status}`,
        title: this.topUpTitle(item.status),
        description: `รายการฝาก ${this.money(item.amount.toString(), item.currency)} มีสถานะ ${this.statusLabel(item.status)}`,
        type: 'finance' as const,
        createdAt: item.updatedAt,
        href: '/transactions',
      })),
      ...withdrawals.map((item) => ({
        id: `withdrawal:${item.id}:${item.status}`,
        title: this.withdrawalTitle(item.status),
        description: `รายการถอนเงิน ${this.money(item.amount.toString(), item.currency)} มีสถานะ ${this.statusLabel(item.status)}`,
        type: 'finance' as const,
        createdAt: item.updatedAt,
        href: '/transactions',
      })),
      ...supportTickets.map((item) => ({
        id: `support:${item.id}:${item.status}`,
        title: `Ticket: ${item.title}`,
        description: `สถานะล่าสุด ${this.statusLabel(item.status)}`,
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
        where: { key: this.channelSettingKey(userId) },
        select: { valueJson: true },
      }),
    ]);

    return {
      preferences: {
        categories: categoryPreference ?? DEFAULT_CATEGORIES,
        channels: this.normalizeChannels(channelSetting?.valueJson),
      },
    };
  }

  async markAllRead(userId: string) {
    const current = await this.listMemberNotifications(userId);
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
    await this.prisma.notificationState.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { readAt: new Date() },
      create: { userId, notificationKey, readAt: new Date() },
    });
    return { success: true, notificationKey, isRead: true };
  }

  async archive(userId: string, notificationKey: string) {
    await this.prisma.notificationState.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { archivedAt: new Date() },
      create: { userId, notificationKey, archivedAt: new Date() },
    });
    return { success: true, notificationKey, archived: true };
  }

  async updatePreferences(userId: string, input: UpdateNotificationPreferencesDto) {
    const current = await this.getPreferences(userId);
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
        where: { key: this.channelSettingKey(userId) },
        update: { valueJson: channels },
        create: {
          key: this.channelSettingKey(userId),
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

  private channelSettingKey(userId: string) {
    return `member.notification.channels.${userId}`;
  }

  private normalizeChannels(value: unknown): NotificationChannels {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_CHANNELS };
    const channels = value as Partial<Record<keyof NotificationChannels, unknown>>;
    return {
      email: typeof channels.email === 'boolean' ? channels.email : DEFAULT_CHANNELS.email,
      sms: typeof channels.sms === 'boolean' ? channels.sms : DEFAULT_CHANNELS.sms,
      push: typeof channels.push === 'boolean' ? channels.push : DEFAULT_CHANNELS.push,
    };
  }

  private money(amount: string, currency: string) {
    const value = Number(amount);
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency }).format(Number.isFinite(value) ? value : 0);
  }

  private statusLabel(status: string) {
    const labels: Record<string, string> = {
      PENDING: 'รอตรวจสอบ',
      APPROVED: 'อนุมัติแล้ว',
      COMPLETED: 'สำเร็จ',
      REJECTED: 'ไม่อนุมัติ',
      CANCELLED: 'ยกเลิก',
      OPEN: 'เปิดอยู่',
      REVIEWING: 'กำลังดูแล',
      RESOLVED: 'แก้ไขแล้ว',
      DISMISSED: 'ปิดแล้ว',
    };
    return labels[status] ?? status;
  }

  private topUpTitle(status: string) {
    return status === 'APPROVED' ? 'ฝากสำเร็จ' : status === 'REJECTED' ? 'รายการฝากไม่ผ่าน' : 'อัปเดตรายการฝาก';
  }

  private withdrawalTitle(status: string) {
    return status === 'COMPLETED' ? 'ถอนเงินสำเร็จ' : status === 'REJECTED' ? 'รายการถอนเงินไม่ผ่าน' : 'อัปเดตรายการถอนเงิน';
  }
}
