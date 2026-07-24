import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('apps/web-admin/app/(admin)/wallet-ledgers/[id]/page.tsx', 'utf8');

assert.match(source, /try\s*{/);
assert.match(source, /catch\s*{/);
assert.match(source, /finally\s*{/);
assert.match(source, /if \(loading\) return/);
assert.match(source, /setPayload\(null\)/);
assert.match(source, /stringifyAdminPayload\(payload\)/);
assert.match(source, /โหลดรายการเดินเงินไม่สำเร็จ กรุณาลองใหม่/);
assert.match(source, /title="รายละเอียดรายการเดินเงิน"/);
assert.doesNotMatch(source, /data\?\.message/);
assert.doesNotMatch(source, /JSON\.stringify\(payload/);

console.log('admin wallet ledger detail safety contract passed');
