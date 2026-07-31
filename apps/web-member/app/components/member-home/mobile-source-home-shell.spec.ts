import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const shellSource = readFileSync(resolve(__dirname, 'mobile-source-home-shell.tsx'), 'utf8');
const shellCss = readFileSync(resolve(__dirname, 'mobile-source-home-shell.module.css'), 'utf8');
const homeSource = readFileSync(resolve(__dirname, '../../member-home.tsx'), 'utf8');

describe('mobile source home shell contract', () => {
  it('loads promotions from the canonical Member promotion runtime', () => {
    expect(shellSource).toContain('loadMemberPromotionCampaigns');
    expect(shellSource).toContain('MEMBER_PROMOTION_FALLBACKS');
    expect(shellSource).not.toContain("memberApiFetch('/public/promotions'");
  });

  it('uses shared Member runtime data for announcements and navigation', () => {
    expect(shellSource).toContain('useMemberRuntime');
    expect(shellSource).toContain('home.announcement');
    expect(shellSource).toContain('navigation.filter');
    expect(shellSource).toContain('features.registration');
    expect(shellSource).toContain('features.login');
  });

  it('provides a real home-screen shortcut flow without a dead download route', () => {
    expect(shellSource).toContain('beforeinstallprompt');
    expect(shellSource).toContain('member-home-shortcut-request');
    expect(shellSource).not.toContain('href="/download');
  });

  it('mounts only in the existing mobile home branch and protects Desktop', () => {
    expect(homeSource).toContain('<MobileSourceHomeShell>');
    expect(homeSource).toContain('<DesktopHomeScaffold');
    expect(homeSource.indexOf('<MobileSourceHomeShell>')).toBeLessThan(homeSource.indexOf('<DesktopHomeScaffold'));
    expect(shellCss).toContain(':global(.v47-mobile-hero)');
    expect(shellCss).toContain('.categoryRail');
  });
});
