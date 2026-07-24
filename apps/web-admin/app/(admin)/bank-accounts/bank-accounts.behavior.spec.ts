import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

describe('bank account admin contract', () => {
  it('uses the shared admin locale contract', () => {
    expect(source).toContain("useAdminLocale");
    expect(source).toContain('copyByLocale');
    expect(source).toContain("th:");
    expect(source).toContain("en:");
  });

  it('guards all async mutations with try/finally state cleanup', () => {
    expect(source).toContain('finally { setLoading(false); }');
    expect(source).toContain('finally { setSaving(false); }');
    expect(source.match(/finally \{ setBusyId\(''\); \}/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('does not surface backend error messages directly', () => {
    expect(source).not.toContain('data?.message');
    expect(source).toContain('copy.loadFailed');
    expect(source).toContain('copy.saveFailed');
    expect(source).toContain('copy.reviewFailed');
  });

  it('disables financial controls while loading or mutating', () => {
    expect(source).toContain('const queueBusy = loading || saving || Boolean(busyId)');
    expect(source).toContain('disabled={queueBusy}');
  });
});
