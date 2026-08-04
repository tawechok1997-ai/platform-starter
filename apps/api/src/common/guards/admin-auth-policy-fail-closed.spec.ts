import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AdminAuthGuard access policy failure contract', () => {
  const source = readFileSync(join(__dirname, 'admin-auth.guard.ts'), 'utf8');

  test('rejects the session when DENY, scope, or team policy cannot be loaded', () => {
    expect(source).toContain("throw new UnauthorizedException('Admin access policy is unavailable')");
    expect(source).toContain('rejecting the admin session');
    expect(source).not.toContain('continuing with role and delegation access only');
  });

  test('delegation lookup remains fail-restrictive by dropping additive permissions only', () => {
    expect(source).toContain('continuing without delegated permissions');
    expect(source).toContain('return [];');
  });
});
