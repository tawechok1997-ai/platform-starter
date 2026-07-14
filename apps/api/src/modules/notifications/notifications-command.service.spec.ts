import { NotificationPreferencePolicy } from './domain/notification-preference.policy';
import { NotificationsCommandService } from './notifications-command.service';

describe('NotificationsCommandService', () => {
  it('normalizes enabled categories through the domain policy before persistence', async () => {
    const notificationPreferenceUpsert = jest.fn().mockResolvedValue({});
    const siteSettingUpsert = jest.fn().mockResolvedValue({});
    const prisma = {
      notificationPreference: { upsert: notificationPreferenceUpsert },
      siteSetting: { upsert: siteSettingUpsert },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    const queries = {
      getPreferences: jest.fn().mockResolvedValue({
        preferences: {
          categories: { finance: true, security: true, promotion: true, system: true },
          channels: { email: true, sms: false, push: false },
        },
      }),
    };
    const normalize = jest.spyOn(NotificationPreferencePolicy, 'normalize');
    const service = new NotificationsCommandService(prisma as never, queries as never);

    const result = await service.updatePreferences('member-1', { email: false, push: true });

    expect(normalize).toHaveBeenCalledWith({ category: 'FINANCE', channels: ['IN_APP', 'PUSH'] });
    expect(normalize).toHaveBeenCalledWith({ category: 'SECURITY', channels: ['IN_APP', 'PUSH'] });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(notificationPreferenceUpsert).toHaveBeenCalled();
    expect(siteSettingUpsert).toHaveBeenCalled();
    expect(result.preferences.channels).toEqual({ email: false, sms: false, push: true });
    normalize.mockRestore();
  });
});
