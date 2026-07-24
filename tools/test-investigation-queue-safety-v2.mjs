import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const queueSource = await readFile(new URL('../apps/web-admin/app/(admin)/investigation/page.tsx', import.meta.url), 'utf8');
const operationsSource = await readFile(new URL('../apps/web-admin/app/(admin)/risk-operations/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "new URLSearchParams({ status: 'REVIEWING', page: '1', take: '100' })",
  'function isInvestigationAlert(value: unknown): value is InvestigationAlert',
  "const [severity, setSeverity] = useState<'' | AlertSeverity>('')",
  "const [owner, setOwner] = useState<OwnerFilter>('')",
  'const [referenceTime, setReferenceTime] = useState(0)',
  'setReferenceTime(Date.now())',
  "owner === 'ASSIGNED'",
  "owner === 'UNASSIGNED'",
  "item.severity === 'HIGH' || item.severity === 'CRITICAL'",
  'referenceTime - new Date(item.updatedAt ?? item.createdAt).getTime()',
  'item.assignedToAdmin?.username',
  'href={`/members/${item.memberId}`}',
  'href={`/risk-alerts/${item.id}`}',
  'finally {',
];

for (const fragment of requiredFragments) {
  assert.ok(queueSource.includes(fragment), `Missing Investigation queue contract fragment: ${fragment}`);
}

assert.equal(queueSource.includes('Date.now() - new Date('), false, 'Investigation queue must not call Date.now during render');
assert.equal(queueSource.includes('data?.message'), false, 'Investigation queue must not render raw backend messages');
assert.ok(operationsSource.includes("href: '/investigation'"), 'Risk Operations must link directly to Investigation queue');

const finallyCount = (queueSource.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 1, `Expected at least one finally block, found ${finallyCount}`);

console.log('Investigation queue safety contract passed');
