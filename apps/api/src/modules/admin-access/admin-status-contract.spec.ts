import { validate } from 'class-validator';
import { ChangeAdminStatusDto } from './dto/admin-access.dto';

describe('Admin status contract', () => {
  test.each(['ACTIVE', 'SUSPENDED', 'LOCKED'])('accepts persisted AdminStatus %s', async (status) => {
    const dto = Object.assign(new ChangeAdminStatusDto(), {
      status,
      reason: 'Operational status review',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  test.each(['DISABLED', 'CLOSED', 'PENDING'])('rejects unsupported status %s', async (status) => {
    const dto = Object.assign(new ChangeAdminStatusDto(), {
      status,
      reason: 'Operational status review',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });
});
