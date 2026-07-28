import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const routeLayout = readFileSync(path.join(appRoot, '(admin)/content-center/layout.tsx'), 'utf8');
const scopedCss = readFileSync(path.join(appRoot, 'admin-modern-content-center.css'), 'utf8');
const featureSource = readFileSync(path.resolve(process.cwd(), 'src/features/cms/content-center-page.tsx'), 'utf8');

test('loads Content Center polish only inside its route scope', () => {
  assert.equal(routeLayout.includes("import '../../admin-modern-content-center.css';"), true);
  assert.equal(routeLayout.includes('className="admin-content-center"'), true);
  assert.equal(scopedCss.includes('.admin-content-center'), true);
  assert.equal(scopedCss.includes('body[data-app-surface'), false);
});

test('keeps CMS lifecycle, storage and unsaved-change contracts feature owned', () => {
  assert.equal(featureSource.includes("adminApiFetch('/admin/settings/features'"), true);
  assert.equal(featureSource.includes("adminApiFetch('/admin/settings/cms-assets'"), true);
  assert.equal(featureSource.includes('AdminUnsavedChangesNotice'), true);
  assert.equal(featureSource.includes('parseCmsContentJson'), true);
  assert.equal(featureSource.includes('stringifyCmsContent'), true);
  assert.equal(featureSource.includes('cmsLifecyclePatch'), true);
});

test('polishes editor cards, media previews and raw JSON without replacing business markup', () => {
  assert.equal(scopedCss.includes('.admin-ui-stack > section[style]'), true);
  assert.equal(scopedCss.includes("textarea[aria-label='CMS Raw JSON']"), true);
  assert.equal(scopedCss.includes("input[type='file'][style]"), true);
  assert.equal(scopedCss.includes('video[style]'), true);
  assert.equal(scopedCss.includes('img[style]'), true);
});

test('preserves responsive and reduced-motion Content Center behavior', () => {
  assert.equal(scopedCss.includes('@media (max-width: 1199px)'), true);
  assert.equal(scopedCss.includes('@media (max-width: 820px)'), true);
  assert.equal(scopedCss.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(scopedCss.includes('grid-template-columns: 1fr'), true);
});
