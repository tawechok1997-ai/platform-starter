import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../app/(admin)/audit-logs/page.tsx', import.meta.url), 'utf8');

describe('audit logs async safety', () => {
  it('uses guarded async loading with cleanup', () => {
    expect(source).toContain('try {');
    expect(source).toContain('catch {');
    expect(source).toContain('finally {');
    expect(source).toContain('setLoading(false)');
  });

  it('validates list payloads and clears stale data on failure', () => {
    expect(source).toContain('Array.isArray(data.items)');
    expect(source).toContain('setItems([])');
    expect(source).toContain('setTotal(0)');
    expect(source).toContain('setPageCount(1)');
  });

  it('does not surface raw backend messages', () => {
    expect(source).not.toContain('data?.message');
    expect(source).toContain('โหลดบันทึกกิจกรรมไม่สำเร็จ กรุณาลองใหม่');
  });

  it('locks filter controls while loading', () => {
    expect(source.match(/disabled=\{loading\}/g)?.length ?? 0).toBeGreaterThanOrEqual(9);
    expect(source).toContain("if (loading) return;");
  });
});
