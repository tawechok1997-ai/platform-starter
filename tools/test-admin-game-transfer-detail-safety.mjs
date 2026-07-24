import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('apps/web-admin/app/(admin)/game-transfers/[id]/page.tsx', 'utf8');

assert.match(source, /try\s*{/);
assert.match(source, /catch\s*{/);
assert.match(source, /finally\s*{/);
assert.match(source, /reason\.length < 5/);
assert.match(source, /if \(!pendingAction \|\| loading\) return/);
assert.match(source, /if \(!loading\) \{ setPendingAction\(null\)/);
assert.match(source, /textarea disabled=\{loading\}/);
assert.match(source, /transferErrorLabel\(item\.errorCode\)/);
assert.doesNotMatch(source, /data\?\.message/);
assert.doesNotMatch(source, /item\.errorMessage \?\? item\.errorCode/);

console.log('admin game transfer detail safety contract passed');
