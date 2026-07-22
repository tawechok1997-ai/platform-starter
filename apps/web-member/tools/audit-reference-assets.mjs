import { createHash } from 'node:crypto';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'public/assets/reference-brand');
const allowedExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.json', '.md']);
const requiredAssets = [
  'header/noah345-logo.webp',
  'header/th.svg',
  'home/support-headset.webp',
  'menu/home.png',
  'menu/casino.png',
  'menu/slot.png',
  'menu/live.png',
  'menu/sport.png',
  'menu/fishing.png',
  'menu/lottery.png',
  'menu/card.png',
  'menu/deposit.png',
  'menu/withdraw.png',
  'menu/promotion.png',
  'menu/bonus.png',
  'menu/affiliate.png',
  'menu/support.png',
  'menu/history.png',
  'menu/notification.png',
  'menu/activities.png',
  'menu/news.png',
  'menu/recommended.png',
  'menu/manifest.json',
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function hasExpectedSignature(extension, bytes) {
  if (extension === '.png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.gif') return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (extension === '.webp') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === '.jpg' || extension === '.jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  if (extension === '.avif') return bytes.subarray(4, 12).toString('ascii').includes('ftyp');
  return true;
}

const files = await walk(root);
const issues = [];
const hashes = new Map();

for (const required of requiredAssets) {
  const absolute = path.join(root, required);
  await access(absolute).catch(() => issues.push(`missing required asset: ${required}`));
}

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const extension = path.extname(file).toLowerCase();
  const metadata = await stat(file);

  if (!allowedExtensions.has(extension)) issues.push(`unsupported extension: ${relative}`);
  if (metadata.size === 0) issues.push(`empty file: ${relative}`);
  if (metadata.size > 4 * 1024 * 1024) issues.push(`oversized asset (>4 MiB): ${relative}`);

  const bytes = await readFile(file);
  if (!hasExpectedSignature(extension, bytes)) issues.push(`file signature does not match extension: ${relative}`);

  const hash = createHash('sha256').update(bytes).digest('hex');
  const duplicate = hashes.get(hash);
  if (duplicate) issues.push(`duplicate content: ${relative} == ${duplicate}`);
  else hashes.set(hash, relative);

  if (extension === '.svg') {
    const source = bytes.toString('utf8');
    if (/<script|\son\w+\s*=|javascript:|data:text\/html/i.test(source)) {
      issues.push(`unsafe SVG content: ${relative}`);
    }
  }
}

console.log(`Reference asset audit: ${files.length} files checked`);
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Reference assets passed integrity checks.');
}