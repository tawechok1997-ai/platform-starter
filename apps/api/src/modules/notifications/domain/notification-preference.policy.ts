import { DomainError } from '../../../common/domain/domain-error';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationCategory = 'SECURITY' | 'FINANCE' | 'SUPPORT' | 'MARKETING' | 'SYSTEM';

type NotificationPreference = Readonly<{
  category: NotificationCategory;
  channels: readonly NotificationChannel[];
}>;

export const NotificationPreferencePolicy = {
  normalize(preference: NotificationPreference): NotificationPreference {
    const channels = [...new Set(preference.channels)];
    if (!channels.includes('IN_APP') && preference.category !== 'MARKETING') channels.unshift('IN_APP');
    return { category: preference.category, channels };
  },
  assertMutable(category: NotificationCategory, channels: readonly NotificationChannel[]): void {
    if (category === 'SECURITY' && !channels.includes('IN_APP')) {
      throw new DomainError('POLICY_VIOLATION', 'Security notifications must remain enabled in-app');
    }
    if (category === 'FINANCE' && channels.length === 0) {
      throw new DomainError('POLICY_VIOLATION', 'Finance notifications cannot be disabled on every channel');
    }
  },
  shouldDeliver(preference: NotificationPreference, channel: NotificationChannel): boolean {
    return this.normalize(preference).channels.includes(channel);
  },
};
