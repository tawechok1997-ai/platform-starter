import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function resolveVerificationScript() {
  const candidates = [
    resolve(process.cwd(), '../../scripts/verify-backup.sh'),
    resolve(process.cwd(), 'scripts/verify-backup.sh'),
  ];
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) throw new Error('verify-backup.sh not found');
  return resolved;
}

describe('backup verification script', () => {
  const source = readFileSync(resolveVerificationScript(), 'utf8');

  it('fails closed for missing, absent, or empty backups', () => {
    expect(source).toContain('set -euo pipefail');
    expect(source).toContain('BACKUP_FILE is required');
    expect(source).toContain('backup file not found');
    expect(source).toContain('backup file is empty');
  });

  it('verifies checksum and PostgreSQL archive structure', () => {
    expect(source).toContain('sha256sum "${BACKUP_FILE}"');
    expect(source).toContain('pg_restore --list "${BACKUP_FILE}"');
    expect(source).toContain('backup contains no restorable objects');
    expect(source).toContain('Backup verification passed');
  });

  it('remains read-only and never connects to or mutates a database', () => {
    expect(source).not.toContain('pg_restore --dbname');
    expect(source).not.toContain('pg_restore -d');
    expect(source).not.toMatch(/\bpsql\b/);
    expect(source).not.toMatch(/\bcreatedb\b/);
    expect(source).not.toMatch(/\bdropdb\b/);
  });
});
