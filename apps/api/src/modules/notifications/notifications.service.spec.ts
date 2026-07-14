import { NotificationsService } from './notifications.service';

describe('NotificationsService facade', () => {
  function setup() {
    const query = {
      listMemberNotifications: jest.fn(),
      getPreferences: jest.fn(),
    };
    const command = {
      markAllRead: jest.fn(),
      markRead: jest.fn(),
      archive: jest.fn(),
      updatePreferences: jest.fn(),
    };
    return { service: new NotificationsService(query as never, command as never), query, command };
  }

  it('delegates preference reads to the query service', async () => {
    const { service, query } = setup();
    query.getPreferences.mockResolvedValue({ preferences: { categories: {}, channels: {} } });

    await expect(service.getPreferences('member-1')).resolves.toEqual({ preferences: { categories: {}, channels: {} } });
    expect(query.getPreferences).toHaveBeenCalledWith('member-1');
  });

  it('delegates partial preference updates to the command service', async () => {
    const { service, command } = setup();
    command.updatePreferences.mockResolvedValue({ preferences: { channels: { push: true } } });

    await expect(service.updatePreferences('member-1', { push: true })).resolves.toEqual({ preferences: { channels: { push: true } } });
    expect(command.updatePreferences).toHaveBeenCalledWith('member-1', { push: true });
  });

  it('delegates notification state mutations', async () => {
    const { service, command } = setup();
    command.markRead.mockResolvedValue({ ok: true });

    await expect(service.markRead('member-1', 'notice-1')).resolves.toEqual({ ok: true });
    expect(command.markRead).toHaveBeenCalledWith('member-1', 'notice-1');
  });
});
