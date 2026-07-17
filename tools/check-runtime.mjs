import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const expectedNodeMajor = 22;
const expectedPnpm = packageJson.engines?.pnpm ?? packageJson.packageManager?.replace(/^pnpm@/, '');
const actualNode = process.versions.node;
const actualNodeMajor = Number(actualNode.split('.')[0]);

let actualPnpm = 'unavailable';
try {
  actualPnpm = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim();
} catch {
  // Report a single actionable failure below.
}

const failures = [];
if (actualNodeMajor !== expectedNodeMajor) {
  failures.push(`Node.js ${expectedNodeMajor}.x required, found ${actualNode}`);
}
if (!expectedPnpm || actualPnpm !== expectedPnpm) {
  failures.push(`pnpm ${expectedPnpm ?? 'version from package.json'} required, found ${actualPnpm}`);
}

if (failures.length > 0) {
  console.error('Runtime contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Run: corepack enable && corepack prepare pnpm@11.13.0 --activate');
  process.exit(1);
}

console.log(`Runtime contract OK: Node ${actualNode}, pnpm ${actualPnpm}`);

try {
  execFileSync(process.execPath, ['tools/audit-root-command-policy.mjs'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(typeof error?.status === 'number' ? error.status : 1);
}
