import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/(admin)/wallet-analytics/page.tsx'), 'utf8');

describe('wallet analytics contract', () => {
  it('keeps required ranges and chart states', () => {
    expect(source).toContain('[7,14,30,90]');
    expect(source).toContain('admin-wallet-analytics__chart');
    expect(source).toContain('ยังไม่มีข้อมูล Wallet Analytics');
  });

  it('keeps accessible legend and per-bar tooltip details', () => {
    expect(source).toContain('admin-wallet-analytics__legend');
    expect(source).toContain('aria-label={tooltip}');
    expect(source).toContain('tabIndex={0}');
  });
});
