import fs from 'node:fs';

const routePath = 'apps/web-admin/app/(admin)/security/page.tsx';
const featurePath = 'apps/web-admin/src/features/auth/admin-security-page.tsx';
const entryPath = 'apps/web-admin/src/features/auth/index.ts';
const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const route = read(routePath);
const feature = read(featurePath);
const entry = read(entryPath);

if (!fs.existsSync(featurePath)) failures.push('missing admin security feature implementation');
if (!route.includes("from '../../../src/features/auth/admin-security-page'")) failures.push('security route must delegate to auth feature');
if (route.includes('adminApiFetch(') || route.includes('useState(') || route.includes('QRCode')) failures.push('security route must remain thin');
if (!feature.includes("from '../../../app/admin-api'")) failures.push('security feature must own auth API orchestration');
if (!feature.includes("from 'qrcode'")) failures.push('security feature must own QR generation');
if (!entry.includes('AdminSecurityPage') || !entry.includes("from './admin-security-page'")) failures.push('auth boundary must export AdminSecurityPage');

if (failures.length) {
  console.error('R-012 security boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('R-012 security boundary audit passed.');
