import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const worklist = await readFile(join(process.cwd(), 'docs', 'master-project-worklist.md'), 'utf8');
const failures = [];

function section(startHeading, endHeading) {
  const start = worklist.indexOf(startHeading);
  const end = endHeading ? worklist.indexOf(endHeading, start + startHeading.length) : worklist.length;
  if (start < 0) {
    failures.push(`missing section start: ${startHeading}`);
    return '';
  }
  if (endHeading && end < 0) {
    failures.push(`missing section end: ${endHeading}`);
    return '';
  }
  return worklist.slice(start, end);
}

function declaredCount(pattern, label) {
  const match = worklist.match(pattern);
  if (!match) {
    failures.push(`missing declared count: ${label}`);
    return null;
  }
  return Number(match[1]);
}

const codeSection = section('# P0 —', '# P6 —');
const externalSection = section('# P6 —', '# ลำดับทำงานถัดไป');
const codeOpen = [...codeSection.matchAll(/^- \[ \]/gm)].length;
const externalOpen = [...externalSection.matchAll(/^- \[ \]/gm)].length;
const totalOpen = codeOpen + externalOpen;

const declaredCode = declaredCount(/งานโค้ดใน P0 ถึง P5:\s*\*\*(\d+) รายการ\*\*/, 'P0-P5 code');
const declaredExternal = declaredCount(/งาน external verification และ UAT ใน P6:\s*\*\*(\d+) รายการ\*\*/, 'P6 external');
const declaredTotal = declaredCount(/รวม checkbox ที่ยังไม่ปิด:\s*\*\*(\d+) รายการ\*\*/, 'total');

if (declaredCode !== null && declaredCode !== codeOpen) failures.push(`declared code count ${declaredCode} != actual ${codeOpen}`);
if (declaredExternal !== null && declaredExternal !== externalOpen) failures.push(`declared external count ${declaredExternal} != actual ${externalOpen}`);
if (declaredTotal !== null && declaredTotal !== totalOpen) failures.push(`declared total ${declaredTotal} != actual ${totalOpen}`);

for (const p of ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']) {
  if (!worklist.includes(`# ${p} —`)) failures.push(`missing ${p} section`);
}

const result = {
  source: 'docs/master-project-worklist.md',
  codeOpen,
  externalOpen,
  totalOpen,
  declared: {
    code: declaredCode,
    external: declaredExternal,
    total: declaredTotal,
  },
  failures,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Master worklist consistency audit');
  console.log(`  code open: ${codeOpen}`);
  console.log(`  external open: ${externalOpen}`);
  console.log(`  total open: ${totalOpen}`);
  console.log(`  failures: ${failures.length}`);
}

if (failures.length) {
  if (!process.argv.includes('--json')) {
    console.error('\nWorklist consistency violations:');
    for (const failure of failures) console.error(`  - ${failure}`);
  }
  process.exitCode = 1;
}
