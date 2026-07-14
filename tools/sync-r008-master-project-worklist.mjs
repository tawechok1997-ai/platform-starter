import { readFile, writeFile } from 'node:fs/promises';

const path = 'docs/master-project-worklist.md';
let source = await readFile(path, 'utf8');

const start = source.indexOf('### R-008 Domain model และ policy separation');
const end = source.indexOf('### R-009 Repository, transaction และ persistence boundary');

if (start < 0 || end < 0 || end <= start) {
  throw new Error('Unable to locate the R-008 block in master-project-worklist.md');
}

const replacement = `### R-008 Domain model และ policy separation

สถานะ: ✅ DONE

- [x] Promotion/bonus models แยกจาก \`RiskAlert.metadata\`
- [x] Affiliate/commission models
- [x] Constraints/indexes/backfill
- [x] Service/frontend migration ของ promotion domain
- [x] แยก Deposit entity/state transition policy
- [x] แยก Withdrawal entity/state transition policy
- [x] แยก Wallet settlement policy
- [x] แยก Admin account/ownership policy
- [x] แยก KYC review policy
- [x] แยก Watchlist matching/override policy
- [x] แยก Support ticket lifecycle policy
- [x] แยก Notification preference policy
- [x] ทำ domain errors ที่ไม่ผูกกับ Nest HTTP exception
- [x] ทำ value objects สำหรับ Money, Phone, BankAccount และ identifiers ที่สำคัญ
- [x] เพิ่ม unit tests สำหรับ invariant และ policy ทุก domain สำคัญ

**หลักฐานปิดงาน:** \`docs/r008-closure-checklist.md\`, \`docs/evidence/r008-final-verification.md\`, \`pnpm audit:r8-closure\`, API typecheck, full API tests และ API build ผ่าน; closure commit \`e9850b22d033edd9f96eba178b1999699a0a5c96\`

`;

source = source.slice(0, start) + replacement + source.slice(end);

if (!source.includes('### R-008 Domain model และ policy separation\n\nสถานะ: ✅ DONE')) {
  throw new Error('R-008 status was not updated to DONE');
}

await writeFile(path, source);
console.log('R-008 master project worklist block synchronized');
