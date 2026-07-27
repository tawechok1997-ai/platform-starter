import fs from 'node:fs';
import path from 'node:path';

const routePath = 'apps/web-admin/app/(admin)/promotion-center/page.tsx';
const featurePath = 'apps/web-admin/src/features/cms/promotion-center-page.tsx';
const entryPath = 'apps/web-admin/src/features/cms/index.ts';
const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readDelegatedFeature = (entryFile) => {
  const source = read(entryFile);
  const match = source.match(/export\s+\{\s*default\s*\}\s+from\s+['"](.+?)['"]/);
  if (!match) return source;
  const targetBase = path.resolve(path.dirname(entryFile), match[1]);
  const targetPath = ['.tsx', '.ts', '.jsx', '.js'].map((extension) => `${targetBase}${extension}`).find(fs.existsSync);
  return targetPath ? `${source}\n${read(targetPath)}` : source;
};
const route = read(routePath);
const feature = readDelegatedFeature(featurePath);
const entry = read(entryPath);

if (!fs.existsSync(featurePath)) failures.push('missing promotion feature implementation');
if (!route.includes("from '../../../src/features/cms/promotion-center-page'")) failures.push('promotion route must delegate to CMS feature');
if (route.includes('adminApiFetch(') || route.includes('useState(')) failures.push('promotion route must remain thin');
if (!feature.includes("from '../../../app/admin-api'")) failures.push('promotion feature must own API orchestration');
if (!entry.includes('PromotionCenterPage') || !entry.includes("from './promotion-center-page'")) failures.push('CMS boundary must export PromotionCenterPage');

if (failures.length) {
  console.error('R-012 promotion boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('R-012 promotion boundary audit passed.');
