import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permission.decorator';
import { AdminKycController } from './admin-kyc.controller';

describe('AdminKycController member snapshot', () => {
  it('reuses the canonical memberCase query owner', async () => {
    const queries = { memberCase: jest.fn().mockResolvedValue({ item: { id: 'kyc-1' }, documents: [] }) };
    const controller = new AdminKycController(queries as any, {} as any, {} as any, {} as any);

    await expect(controller.getMemberCase('member-1')).resolves.toEqual({ item: { id: 'kyc-1' }, documents: [] });
    expect(queries.memberCase).toHaveBeenCalledWith('member-1');
  });

  it('keeps member KYC behind risk.view', () => {
    const required = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, AdminKycController.prototype.getMemberCase);
    expect(required).toEqual(['risk.view']);
  });
});
