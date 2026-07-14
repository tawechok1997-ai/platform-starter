import { SupportService } from './support.service';

describe('SupportService facade', () => {
  const member = { id: 'member-1' };
  const admin = { id: 'admin-1', permissions: [], sessionId: 'session-1' };

  function setup() {
    const queries = {
      listMemberTickets: jest.fn(),
      getMemberTicket: jest.fn(),
      listAdminTickets: jest.fn(),
      getAdminTicket: jest.fn(),
    };
    const commands = {
      createMemberTicket: jest.fn(),
      memberReply: jest.fn(),
      registerMemberAttachment: jest.fn(),
      removeMemberAttachment: jest.fn(),
      adminReply: jest.fn(),
      registerAdminAttachment: jest.fn(),
      removeAdminAttachment: jest.fn(),
      adminUpdate: jest.fn(),
    };
    return { service: new SupportService(queries as never, commands as never), queries, commands };
  }

  it('delegates member mutations to the command service', async () => {
    const { service, commands } = setup();
    commands.memberReply.mockResolvedValue({ ok: true });

    await expect(service.memberReply(member, 'ticket-1', { message: 'More details' })).resolves.toEqual({ ok: true });
    expect(commands.memberReply).toHaveBeenCalledWith(member, 'ticket-1', { message: 'More details' });
  });

  it('delegates admin mutations with the authenticated actor', async () => {
    const { service, commands } = setup();
    commands.adminUpdate.mockResolvedValue({ ok: true });

    await expect(service.adminUpdate(admin, 'ticket-1', { status: 'RESOLVED', note: 'fixed' })).resolves.toEqual({ ok: true });
    expect(commands.adminUpdate).toHaveBeenCalledWith(admin, 'ticket-1', { status: 'RESOLVED', note: 'fixed' });
  });

  it('delegates queries without retaining duplicate business logic', async () => {
    const { service, queries } = setup();
    queries.getMemberTicket.mockResolvedValue({ id: 'ticket-1' });

    await expect(service.getMemberTicket(member, 'ticket-1')).resolves.toEqual({ id: 'ticket-1' });
    expect(queries.getMemberTicket).toHaveBeenCalledWith(member, 'ticket-1');
  });
});
