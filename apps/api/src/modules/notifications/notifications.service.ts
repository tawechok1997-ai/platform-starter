import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
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
    const [states, preference] = await Promise.all([
      this.prisma.notificationState.findMany({ where: { userId, notificationKey: { in: items.map((item) => item.id) } }, select: { notificationKey: true, readAt: true, archivedAt: true } }),
      this.prisma.notificationPreference.findUnique({ where: { userId }, select: { finance: true, security: true, promotion: true, system: true } }),
    ]);
    const stateByKey = new Map(states.map((state) => [state.notificationKey, state]));
    const preferences = preference ?? { finance: true, security: true, promotion: true, system: true };
    const visibleItems = items.filter((item) => preferences[item.type] !== false && !stateByKey.get(item.id)?.archivedAt);
    const limited = visibleItems.slice(0, 50).map((item) => {
      const state = stateByKey.get(item.id);
      return { ...item, createdAt: item.createdAt.toISOString(), isRead: Boolean(state?.readAt), readAt: state?.readAt?.toISOString() ?? null };
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
      preferences,
    };
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

  async updatePreferences(userId: string, input: Partial<Record<NotificationType, boolean>>) {
    const data = {
      finance: input.finance ?? true,
      security: input.security ?? true,
      promotion: input.promotion ?? true,
      system: input.system ?? true,
    };
    const preference = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
      select: data,
    });
    return { preferences: preference };
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
