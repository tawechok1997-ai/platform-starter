import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const worklist = await readFile(join(process.cwd(), 'docs', 'master-project-worklist.md'), 'utf8');
const failures = [];

function section(startHeading, endHeading) {
  const start = worklist.indexOf(startHeading);
  const end = endHeading ? worklist.indexOf(endHeading, start + startHeading.length) : worklist.length;
  if (start < 0 || end < 0) {
    failures.push(`missing section boundary: ${startHeading}`);
    return '';
  }
  return worklist.slice(start, end);
}

const codeSection = section('# P0 —', '# P6 —');
const externalSection = section('# P6 —', '# ลำดับทำงานโค้ดถัดไป');
const codeOpen = [...codeSection.matchAll(/^- \[ \]/gm)].length;
const externalOpen = [...externalSection.matchAll(/^- \[ \]/gm)].length;
const totalOpen = codeOpen + externalOpen;

const declaredCode = Number(worklist.match(/งานโค้ดใน P0 ถึง P5:\s*\*\*(\d+) รายการ\*\*/)?.[1]);
const declaredExternal = Number(worklist.match(/งาน external verification และ UAT ใน P6:\s*\*\*(\d+) รายการ\*\*/)?.[1]);
const declaredTotal = Number(worklist.match(/รวม checkbox ที่ยังไม่ปิด:\s*\*\*(\d+) รายการ\*\*/)?.[1]);

if (declaredCode !== codeOpen) failures.push(`declared code count ${declaredCode} != actual ${codeOpen}`);
if (declaredExternal !== externalOpen) failures.push(`declared external count ${declaredExternal} != actual ${externalOpen}`);
if (declaredTotal !== totalOpen) failures.push(`declared total ${declaredTotal} != actual ${totalOpen}`);

for (const p of ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']) {
  if (!worklist.includes(`# ${p} —`)) failures.push(`missing ${p} section`);
}

console.log('Master worklist consistency audit');
console.log(`  code open: ${codeOpen}`);
console.log(`  external open: ${externalOpen}`);
console.log(`  total open: ${totalOpen}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nWorklist consistency violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
