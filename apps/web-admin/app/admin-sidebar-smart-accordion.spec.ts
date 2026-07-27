import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const controller = readFileSync(path.join(appDir, 'admin-sidebar-behavior-controller.tsx'), 'utf8');
const css = readFileSync(path.join(appDir, 'admin-sidebar-smart-accordion.css'), 'utf8');

test('loads smart accordion after the legacy static group styles', () => {
  const staticIndex = layout.indexOf("import './admin-static-sidebar-groups.css'");
  const accordionIndex = layout.indexOf("import './admin-sidebar-smart-accordion.css'");
  assert.ok(staticIndex >= 0);
  assert.ok(accordionIndex > staticIndex);
  assert.match(layout, /<AdminSidebarBehaviorController \/>/);
});

test('keeps only the current route group open and collapses the others', () => {
  assert.match(controller, /usePathname\(\)/);
  assert.match(controller, /querySelector\('a\[aria-current="page"\]'\)/);
  assert.match(controller, /trigger !== currentTrigger[\s\S]*aria-expanded'\) === 'true'[\s\S]*trigger\.click\(\)/);
  assert.match(controller, /currentTrigger\.getAttribute\('aria-expanded'\) !== 'true'[\s\S]*currentTrigger\.click\(\)/);
  assert.match(controller, /closeOtherGroups\(trigger\)/);
  assert.match(controller, /removeItem\('admin_nav_open_groups'\)/);
});

test('restores manual submenu toggles and anchors the profile below navigation', () => {
  assert.match(css, /\.admin-nav-group__trigger[\s\S]*pointer-events: auto !important/);
  assert.match(css, /\.admin-nav-group__chevron[\s\S]*display: inline-flex !important/);
  assert.match(css, /\.admin-nav-submenu\[data-open='false'\][\s\S]*grid-template-rows: 0fr !important/);
  assert.match(css, /\.admin-nav-submenu\[data-open='true'\][\s\S]*grid-template-rows: minmax\(0, 1fr\) !important/);
  assert.match(css, /\.admin-drawer[\s\S]*grid-template-rows: auto auto minmax\(0, 1fr\) auto !important/);
  assert.match(css, /\.admin-sidebar-footer[\s\S]*align-self: end !important[\s\S]*margin-top: auto !important/);
});
