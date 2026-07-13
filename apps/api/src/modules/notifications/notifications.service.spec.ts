import { NotificationsService } from './notifications.service';

describe('NotificationsService preferences', () => {
  function createService(options?: {
    categoryPreference?: Record<string, boolean> | null;
    channelPreference?: Record<string, boolean> | null;
  }) {
    const notificationPreference = {
      findUnique: jest.fn().mockResolvedValue(options?.categoryPreference ?? null),
      upsert: jest.fn().mockResolvedValue({}),
    };
    const siteSetting = {
      findUnique: jest.fn().mockResolvedValue(
        options?.channelPreference === undefined
          ? null
          : { valueJson: options.channelPreference },
      ),
      upsert: jest.fn().mockResolvedValue({}),
    };
    const prisma = {
      notificationPreference,
      siteSetting,
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    };

    return {
      service: new NotificationsService(prisma as never),
      prisma,
    };
  }

  it('returns safe defaults when preferences do not exist', async () => {
    const { service } = createService();

    await expect(service.getPreferences('member-1')).resolves.toEqual({
      preferences: {
        categories: {
          finance: true,
          security: true,
          promotion: true,
          system: true,
        },
        channels: {
          email: true,
          sms: false,
          push: true,
        },
      },
    });
  });

  it('preserves unspecified values during a partial update', async () => {
    const { service, prisma } = createService({
      categoryPreference: {
        finance: false,
        security: true,
        promotion: false,
        system: true,
      },
      channelPreference: {
        email: false,
        sms: true,
        push: false,
      },
    });

    const result = await service.updatePreferences('member-1', { push: true });

    expect(result).toEqual({
      preferences: {
        categories: {
          finance: false,
          security: true,
          promotion: false,
          system: true,
        },
        channels: {
          email: false,
          sms: true,
          push: true,
        },
      },
    });
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'member-1' },
        update: {
          finance: false,
          security: true,
          promotion: false,
          system: true,
        },
      }),
    );
    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'member.notification.channels.member-1' },
        update: {
          valueJson: {
            email: false,
            sms: true,
            push: true,
          },
        },
      }),
    );
  });

  it('normalizes malformed channel values without changing valid booleans', async () => {
    const { service } = createService({
      channelPreference: {
        email: false,
        sms: 'yes' as unknown as boolean,
        push: true,
      },
    });

    await expect(service.getPreferences('member-1')).resolves.toEqual(
      expect.objectContaining({
        preferences: expect.objectContaining({
          channels: {
            email: false,
            sms: false,
            push: true,
          },
        }),
      }),
    );
  });
});