import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const rootLayout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const protectedLayout = readFileSync(path.join(appDir, '(admin)', 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appDir, 'admin-sidebar-smart-accordion.css'), 'utf8');

test('loads smart accordion after the legacy static group styles', () => {
  const staticIndex = rootLayout.indexOf("import './admin-static-sidebar-groups.css'");
  const accordionIndex = rootLayout.indexOf("import './admin-sidebar-smart-accordion.css'");
  assert.ok(staticIndex >= 0);
  assert.ok(accordionIndex > staticIndex);
  assert.match(rootLayout, /<AdminMobileDrawerController \/>/);
  assert.doesNotMatch(rootLayout, /AdminSidebarBehaviorController/);
});

test('keeps only the current route group open and collapses the others', () => {
  assert.match(protectedLayout, /setOpenGroups\(activeGroup \? new Set\(\[activeGroup\.id\]\) : new Set\(\)\)/);
  assert.match(protectedLayout, /setOpenGroups\(\(current\) => current\.has\(groupId\) \? new Set\(\) : new Set\(\[groupId\]\)\)/);
  assert.match(protectedLayout, /const expanded = Boolean\(normalizedQuery\) \|\| openGroups\.has\(group\.id\)/);
  assert.doesNotMatch(protectedLayout, /openGroups\.has\(group\.id\) \|\| containsActiveRoute/);
  assert.match(protectedLayout, /removeItem\('admin_nav_open_groups'\)/);
  assert.doesNotMatch(protectedLayout, /setItem\('admin_nav_open_groups'/);
});

test('restores manual submenu toggles and anchors the profile below navigation', () => {
  assert.match(css, /\.admin-nav-group__trigger[\s\S]*pointer-events: auto !important/);
  assert.match(css, /\.admin-nav-group__chevron[\s\S]*display: inline-flex !important/);
  assert.match(css, /\.admin-nav-submenu\[data-open='false'\][\s\S]*grid-template-rows: 0fr !important/);
  assert.match(css, /\.admin-nav-submenu\[data-open='true'\][\s\S]*grid-template-rows: minmax\(0, 1fr\) !important/);
  assert.match(css, /\.admin-drawer[\s\S]*grid-template-rows: auto auto minmax\(0, 1fr\) auto !important/);
  assert.match(css, /\.admin-sidebar-footer[\s\S]*align-self: end !important[\s\S]*margin-top: auto !important/);
});

test('fits the desktop sidebar without scrolling and keeps mobile safely scrollable', () => {
  assert.match(css, /@media \(min-width: 1100px\)[\s\S]*\.admin-drawer-nav[\s\S]*overflow: hidden !important/);
  assert.match(css, /\.admin-drawer-nav > \.admin-quick-nav[\s\S]*display: none !important/);
  assert.match(css, /@media \(min-width: 1100px\) and \(max-height: 900px\)/);
  assert.match(css, /@media \(min-width: 1100px\) and \(max-height: 780px\)/);
  assert.match(css, /@media \(max-width: 1099px\)[\s\S]*\.admin-drawer-nav[\s\S]*overflow-y: auto !important/);
});

test('keeps the profile control compact instead of consuming the footer', () => {
  assert.match(css, /\.admin-sidebar-profile__trigger[\s\S]*min-height: 48px !important[\s\S]*padding: 6px 8px !important/);
  assert.match(css, /\.admin-sidebar-profile__trigger \.admin-profile-avatar[\s\S]*width: 34px !important[\s\S]*height: 34px !important/);
  assert.match(css, /max-height: 780px[\s\S]*\.admin-sidebar-profile__trigger[\s\S]*min-height: 40px !important/);
});
