import { NotificationType } from './notification.mapper';

export const NOTIFICATION_FEED_SOURCE_LIMIT = 20;
export const NOTIFICATION_FEED_RESULT_LIMIT = 50;

export const TOP_UP_NOTIFICATION_LIST_PROJECTION = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  updatedAt: true,
} as const;

export const WITHDRAWAL_NOTIFICATION_LIST_PROJECTION = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  updatedAt: true,
} as const;

export const SUPPORT_NOTIFICATION_LIST_PROJECTION = {
  id: true,
  title: true,
  status: true,
  updatedAt: true,
} as const;

export const LOGIN_NOTIFICATION_LIST_PROJECTION = {
  id: true,
  success: true,
  ipAddress: true,
  reason: true,
  createdAt: true,
} as const;

export const NOTIFICATION_STATE_LIST_PROJECTION = {
  notificationKey: true,
  readAt: true,
  archivedAt: true,
} as const;

export const NOTIFICATION_PREFERENCE_DETAIL_PROJECTION = {
  finance: true,
  security: true,
  promotion: true,
  system: true,
} as const;

export const NOTIFICATION_CHANNEL_DETAIL_PROJECTION = {
  valueJson: true,
} as const;

export type NotificationSummaryItem = {
  type: NotificationType;
};

export function buildNotificationFeedSummary(items: readonly NotificationSummaryItem[]) {
  return {
    total: items.length,
    counts: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>),
  };
}
