import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const index = await readFile(join(root, 'docs/README.md'), 'utf8');
const canonical = [
  'AGENTS.md',
  'docs/GETTING_STARTED.md',
  'docs/TROUBLESHOOTING.md',
  'docs/SECURITY.md',
  'docs/operations/engineering-handoff.md',
  'docs/operations/codebase-professionalization-audit.md',
  'docs/security/public-assets.md',
  'docs/operations/repository-size-migration.md',
];
const failures = [];

for (const path of canonical) {
  const content = await readFile(join(root, path), 'utf8').catch(() => null);
  if (content == null) {
    failures.push(`${path}: missing canonical document`);
    continue;
  }

  for (const marker of ['Updated:', 'Owner:', 'Status:']) {
    if (!content.includes(marker)) failures.push(`${path}: missing ${marker}`);
  }

  if (path.startsWith('docs/') && path !== 'docs/README.md') {
    const relative = path.slice('docs/'.length);
    if (!index.includes(`(${relative})`) && !index.includes(`../${relative}`)) {
      failures.push(`${path}: not linked from docs/README.md`);
    }
  }
}

const rootReadme = await readFile(join(root, 'README.md'), 'utf8');
for (const required of ['docs/GETTING_STARTED.md', 'docs/README.md', 'docs/master-project-worklist.md']) {
  if (!rootReadme.includes(required)) failures.push(`README.md: missing link to ${required}`);
}

console.log('Canonical documentation metadata audit');
console.log(`  documents: ${canonical.length}`);
console.log(`  violations: ${failures.length}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
