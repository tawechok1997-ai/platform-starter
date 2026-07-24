import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(appRoot, 'app/admin-mobile-drawer-controller.tsx'), 'utf8');
const css = fs.readFileSync(path.join(appRoot, 'app/admin-mobile-drawer-fix.css'), 'utf8');
const rootLayout = fs.readFileSync(path.join(appRoot, 'app/layout.tsx'), 'utf8');

describe('mobile admin drawer contract', () => {
  it('mounts the dedicated mobile controller after the shell', () => {
    expect(rootLayout).toContain("import './admin-mobile-drawer-fix.css';");
    expect(rootLayout).toContain('<AdminMobileDrawerController />');
  });

  it('uses a full viewport drawer on mobile', () => {
    expect(css).toContain('width: 100dvw !important');
    expect(css).toContain('height: 100dvh !important');
    expect(css).toContain('#admin-sidebar .admin-drawer-head');
    expect(css).toContain('#admin-sidebar .admin-sidebar-footer');
  });

  it('keeps profile identity, close, locale and logout functional', () => {
    expect(controller).toContain("useAdminLocale()");
    expect(controller).toContain("AdminIcon name=\"close\"");
    expect(controller).toContain("changeLocale('th')");
    expect(controller).toContain("changeLocale('en')");
    expect(controller).toContain("await adminApiFetch('/admin/auth/logout'");
    expect(controller).toContain('clearAdminSession()');
    expect(controller).toContain("window.location.href = '/login'");
  });

  it('shows the current administrator name and role', () => {
    expect(controller).toContain("admin.displayName");
    expect(controller).toContain("roleLabel(admin.roles)");
    expect(controller).toContain("admin.department");
  });
});
