import { ConflictException } from '@nestjs/common';
import { DepositWorkflowService } from './deposit-workflow.service';

describe('DepositWorkflowService claim ownership', () => {
  const service = new DepositWorkflowService({} as any, {} as any);

  it('rejects an unclaimed request', () => {
    expect(() => (service as any).assertClaimOwner(null, 'admin-1')).toThrow(ConflictException);
  });

  it('rejects a request claimed by another admin', () => {
    expect(() => (service as any).assertClaimOwner('admin-2', 'admin-1')).toThrow(ConflictException);
  });

  it('accepts the current claim owner', () => {
    expect(() => (service as any).assertClaimOwner('admin-1', 'admin-1')).not.toThrow();
  });
});
