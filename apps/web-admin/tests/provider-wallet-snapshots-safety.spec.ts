import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/(admin)/provider-wallet-snapshots/page.tsx'), 'utf8');

describe('provider wallet snapshots safety', () => {
  it('uses shared confirmation instead of native prompts', () => {
    expect(source).toContain('AdminConfirmDialog');
    expect(source).not.toContain('window.prompt');
    expect(source).not.toContain('window.confirm');
  });

  it('guards async work and cleans busy state', () => {
    expect(source).toContain('try {');
    expect(source).toContain('catch {');
    expect(source).toContain('finally {');
    expect(source).toContain('if (!pendingReview || loading || reviewing) return');
    expect(source).toContain('setReviewing(\'\')');
  });

  it('requires a meaningful review note', () => {
    expect(source).toContain('note.length < 5');
    expect(source).toContain('อย่างน้อย 5 ตัวอักษร');
  });

  it('redacts payloads and avoids backend messages', () => {
    expect(source).toContain('stringifyAdminPayload');
    expect(source).not.toContain('data?.message');
    expect(source).not.toContain('JSON.stringify({ rawPayload');
  });

  it('locks controls while requests are active', () => {
    expect(source).toContain('const busy = loading || Boolean(reviewing)');
    expect(source).toContain('disabled={busy}');
    expect(source).toContain('busy={Boolean(reviewing)}');
  });
});
