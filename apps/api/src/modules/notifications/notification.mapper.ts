import { Prisma } from '@prisma/client';

export type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
export type NotificationChannels = { email: boolean; sms: boolean; push: boolean };
export type NotificationCategories = Record<NotificationType, boolean>;

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: Date;
  href?: string;
};

export const DEFAULT_CATEGORIES: NotificationCategories = {
  finance: true,
  security: true,
  promotion: true,
  system: true,
};

export const DEFAULT_CHANNELS: NotificationChannels = {
  email: true,
  sms: false,
  push: true,
};

export function channelSettingKey(userId: string): string {
  return `member.notification.channels.${userId}`;
}

export function normalizeChannels(value: Prisma.JsonValue | null | undefined): NotificationChannels {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_CHANNELS };
  const channels = value as Partial<Record<keyof NotificationChannels, unknown>>;
  return {
    email: typeof channels.email === 'boolean' ? channels.email : DEFAULT_CHANNELS.email,
    sms: typeof channels.sms === 'boolean' ? channels.sms : DEFAULT_CHANNELS.sms,
    push: typeof channels.push === 'boolean' ? channels.push : DEFAULT_CHANNELS.push,
  };
}

export function money(amount: string, currency: string): string {
  const value = Number(amount);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency }).format(Number.isFinite(value) ? value : 0);
}

export function statusLabel(status: string): string {
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

export function topUpTitle(status: string): string {
  return status === 'APPROVED' ? 'ฝากสำเร็จ' : status === 'REJECTED' ? 'รายการฝากไม่ผ่าน' : 'อัปเดตรายการฝาก';
}

export function withdrawalTitle(status: string): string {
  return status === 'COMPLETED' ? 'ถอนเงินสำเร็จ' : status === 'REJECTED' ? 'รายการถอนเงินไม่ผ่าน' : 'อัปเดตรายการถอนเงิน';
}
