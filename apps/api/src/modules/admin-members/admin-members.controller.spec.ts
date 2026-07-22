import { AdminMembersController } from './admin-members.controller';

describe('AdminMembersController', () => {
  it('routes the static insights endpoint to the insights query', async () => {
    const getMemberInsights = jest.fn().mockResolvedValue({ totals: { total: 1 } });
    const queries = { getMemberInsights, listMembers: jest.fn(), getMemberDetail: jest.fn() };
    const controller = new AdminMembersController(queries as never, {} as never);

    await expect(controller.getMemberInsights({ from: '2026-07-01', to: '2026-07-07' })).resolves.toEqual({ totals: { total: 1 } });
    expect(getMemberInsights).toHaveBeenCalledWith({ from: '2026-07-01', to: '2026-07-07' });
    expect(queries.getMemberDetail).not.toHaveBeenCalled();
  });
});
