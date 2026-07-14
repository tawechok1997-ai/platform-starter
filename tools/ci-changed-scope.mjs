import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function changedFiles() {
  const event = process.env.GITHUB_EVENT_NAME;
  if (!process.env.CI || !event) return [];

  try {
    if (event === 'pull_request' && process.env.GITHUB_BASE_REF) {
      git(['fetch', '--no-tags', '--depth=1', 'origin', process.env.GITHUB_BASE_REF]);
      return git(['diff', '--name-only', `origin/${process.env.GITHUB_BASE_REF}...HEAD`]).split('\n').filter(Boolean);
    }

    const before = process.env.GITHUB_EVENT_BEFORE;
    if (before && !/^0+$/.test(before)) {
      return git(['diff', '--name-only', `${before}...HEAD`]).split('\n').filter(Boolean);
    }
  } catch (error) {
    console.warn(`Changed-file detection fell back to full scope: ${error.message}`);
  }

  return [];
}

const files = changedFiles();
const fullScope = files.length === 0 || files.some((file) =>
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig|eslint\.config|\.prettier|prisma\/|packages\/|tools\/|\.github\/workflows\/)/.test(file),
);

const scopes = {
  api: fullScope || files.some((file) => file.startsWith('apps/api/')),
  admin: fullScope || files.some((file) => file.startsWith('apps/web-admin/')),
  member: fullScope || files.some((file) => file.startsWith('apps/web-member/')),
  packages: fullScope || files.some((file) => file.startsWith('packages/')),
};

const output = process.env.GITHUB_OUTPUT;
if (output) {
  for (const [name, enabled] of Object.entries(scopes)) appendFileSync(output, `${name}=${enabled}\n`);
  appendFileSync(output, `full=${fullScope}\n`);
}

console.log(`Changed files: ${files.length || 'unknown; full scope'}`);
for (const file of files) console.log(`  - ${file}`);
console.log(`Scopes: ${JSON.stringify(scopes)}`);
