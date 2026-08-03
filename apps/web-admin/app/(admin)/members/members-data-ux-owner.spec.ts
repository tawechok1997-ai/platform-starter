import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('Member directory uses the shared server-paginated table owner', () => {
  assert.match(source, /AdminDataTable/);
  assert.match(source, /AdminDataColumn<MemberItem>/);
  assert.match(source, /rows=\{items\}/);
  assert.match(source, /totalItems=\{total\}/);
  assert.match(source, /onPageChange=\{setPage\}/);
  assert.equal(source.includes('admin-members-table-wrap'), false);
  assert.equal(source.includes('<table className="admin-members-table">'), false);
});

test('Member details use the canonical accessible drawer owner', () => {
  assert.match(source, /from '\.\.\/_components\/admin-drawer'/);
  assert.match(source, /<AdminDrawer open=\{Boolean\(drawerId\)\}/);
  assert.match(source, /closeLabel=\{copy\.close\}/);
  assert.equal(source.includes('admin-member-drawer-layer'), false);
  assert.equal(source.includes('<aside className="admin-member-drawer"'), false);
});

test('PII and balance masking remain permission-aware after migration', () => {
  assert.match(source, /maskPhone\(item\.phone, canViewPii\)/);
  assert.match(source, /maskEmail\(item\.email, canViewPii\)/);
  assert.match(source, /canViewBalances \? formatMoney\(item\.availableBalance\) : '••••••'/);
});
