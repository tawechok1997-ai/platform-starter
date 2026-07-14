import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('apps/api/src');
const findings = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && full.endsWith('.ts')) {
      const source = await readFile(full, 'utf8');
      if (!source.includes('adminAuditLog.create')) continue;
      const usesBuilder = source.includes('buildAdminAuditData');
      findings.push({ file: path.relative(process.cwd(), full), usesBuilder });
    }
  }
}

await walk(root);

const legacy = findings.filter((item) => !item.usesBuilder);
console.log(`Admin audit writers: ${findings.length}`);
for (const item of findings) console.log(`${item.usesBuilder ? 'OK' : 'LEGACY'} ${item.file}`);
console.log(`Legacy writers remaining: ${legacy.length}`);

if (process.env.ADMIN_AUDIT_WRITERS_STRICT === '1' && legacy.length > 0) process.exitCode = 1;
