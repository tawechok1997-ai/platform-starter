import fs from 'node:fs';

const tokenPath = 'packages/design-tokens/type-motion-layout.css';
const layoutPaths = [
  'apps/web-admin/app/layout.tsx',
  'apps/web-member/app/layout.tsx',
];

const requiredTokens = [
  '--font-family-sans',
  '--font-size-xs',
  '--font-size-md',
  '--font-size-4xl',
  '--line-height-body',
  '--font-weight-regular',
  '--font-weight-bold',
  '--font-weight-black',
  '--motion-duration-fast',
  '--motion-duration-normal',
  '--motion-ease-standard',
  '--motion-ease-enter',
  '--breakpoint-sm',
  '--breakpoint-md',
  '--breakpoint-lg',
  '--breakpoint-xl',
  '--z-sticky',
  '--z-dropdown',
  '--z-backdrop',
  '--z-drawer',
  '--z-modal',
  '--z-toast',
];

const source = fs.readFileSync(tokenPath, 'utf8');
const failures = [];

for (const token of requiredTokens) {
  if (!source.includes(`${token}:`)) failures.push(`missing token ${token}`);
}

const declarations = [...source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)];
for (const [, name, value] of declarations) {
  if (value.includes(`var(${name})`)) failures.push(`self-referencing token ${name}`);
}

const zValues = Object.fromEntries(
  declarations
    .filter(([, name]) => name.startsWith('--z-'))
    .map(([, name, value]) => [name, Number(value.trim())]),
);
const orderedLayers = ['--z-sticky', '--z-header', '--z-dropdown', '--z-backdrop', '--z-drawer', '--z-modal', '--z-toast', '--z-tooltip'];
for (let index = 1; index < orderedLayers.length; index += 1) {
  const previous = orderedLayers[index - 1];
  const current = orderedLayers[index];
  if (!(zValues[current] > zValues[previous])) failures.push(`z-index order invalid: ${current} must exceed ${previous}`);
}

for (const layoutPath of layoutPaths) {
  const layout = fs.readFileSync(layoutPath, 'utf8');
  if (!layout.includes("../../../packages/design-tokens/type-motion-layout.css")) {
    failures.push(`${layoutPath} does not import shared type/motion/layout tokens`);
  }
}

if (failures.length > 0) {
  console.error('R-013 type/motion/layout contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`R-013 type/motion/layout contract passed with ${declarations.length} shared tokens.`);
