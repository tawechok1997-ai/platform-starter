'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminLocale } from './(admin)/admin-locale';

type AdminThemePreference = 'light' | 'dark' | 'system';
type AdminDensityPreference = 'comfortable' | 'compact';
type AdminContrastPreference = 'normal' | 'high';
type AdminMotionPreference = 'system' | 'reduced';

type AdminAppearancePreferences = {
  theme: AdminThemePreference;
  density: AdminDensityPreference;
  contrast: AdminContrastPreference;
  motion: AdminMotionPreference;
};

const STORAGE_KEY = 'admin_appearance_preferences_v1';
const DEFAULT_PREFERENCES: AdminAppearancePreferences = {
  theme: 'dark',
  density: 'comfortable',
  contrast: 'normal',
  motion: 'system',
};

const copy = {
  th: {
    open: 'ตั้งค่าหน้าตา',
    title: 'หน้าตาและการแสดงผล',
    description: 'ใช้ค่าชุดเดียวกันทุกหน้า Admin',
    theme: 'ธีม',
    light: 'สว่าง',
    dark: 'มืด',
    system: 'ตามระบบ',
    density: 'ความหนาแน่น',
    comfortable: 'ปกติ',
    compact: 'กระชับ',
    contrast: 'ความคมชัด',
    normal: 'มาตรฐาน',
    high: 'สูง',
    motion: 'การเคลื่อนไหว',
    motionSystem: 'ตามระบบ',
    reduced: 'ลดการเคลื่อนไหว',
    close: 'ปิด',
  },
  en: {
    open: 'Appearance settings',
    title: 'Appearance & display',
    description: 'One shared preference source for every Admin page',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    density: 'Density',
    comfortable: 'Comfortable',
    compact: 'Compact',
    contrast: 'Contrast',
    normal: 'Standard',
    high: 'High',
    motion: 'Motion',
    motionSystem: 'System',
    reduced: 'Reduced motion',
    close: 'Close',
  },
} as const;

export function AdminAppearanceRuntime() {
  const [locale] = useAdminLocale();
  const [preferences, setPreferences] = useState<AdminAppearancePreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const text = copy[locale];

  useEffect(() => {
    const stored = readPreferences();
    setPreferences(stored);
    applyPreferences(stored);
    setMounted(true);

    const findTarget = () => setPortalTarget(document.querySelector<HTMLElement>('.admin-topbar-actions'));
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyPreferences(preferences);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [mounted, preferences]);

  useEffect(() => {
    if (!mounted || preferences.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyPreferences(preferences);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [mounted, preferences]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const resolvedTheme = useMemo(() => {
    if (!mounted) return 'dark';
    if (preferences.theme !== 'system') return preferences.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [mounted, preferences.theme]);

  if (!mounted) return null;

  const control = (
    <div className="admin-appearance-control" ref={rootRef} data-open={open || undefined}>
      <button
        type="button"
        className="admin-appearance-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="admin-appearance-panel"
        aria-label={text.open}
        title={text.open}
      >
        <ThemeIcon theme={resolvedTheme} />
        <span className="admin-appearance-trigger__label">{resolvedTheme === 'dark' ? text.dark : text.light}</span>
      </button>

      {open && (
        <section id="admin-appearance-panel" className="admin-appearance-panel" role="dialog" aria-label={text.title}>
          <header>
            <div>
              <strong>{text.title}</strong>
              <span>{text.description}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={text.close}>×</button>
          </header>

          <PreferenceGroup label={text.theme}>
            <Choice active={preferences.theme === 'light'} onClick={() => setPreferences((current) => ({ ...current, theme: 'light' }))}>{text.light}</Choice>
            <Choice active={preferences.theme === 'dark'} onClick={() => setPreferences((current) => ({ ...current, theme: 'dark' }))}>{text.dark}</Choice>
            <Choice active={preferences.theme === 'system'} onClick={() => setPreferences((current) => ({ ...current, theme: 'system' }))}>{text.system}</Choice>
          </PreferenceGroup>

          <PreferenceGroup label={text.density}>
            <Choice active={preferences.density === 'comfortable'} onClick={() => setPreferences((current) => ({ ...current, density: 'comfortable' }))}>{text.comfortable}</Choice>
            <Choice active={preferences.density === 'compact'} onClick={() => setPreferences((current) => ({ ...current, density: 'compact' }))}>{text.compact}</Choice>
          </PreferenceGroup>

          <PreferenceGroup label={text.contrast}>
            <Choice active={preferences.contrast === 'normal'} onClick={() => setPreferences((current) => ({ ...current, contrast: 'normal' }))}>{text.normal}</Choice>
            <Choice active={preferences.contrast === 'high'} onClick={() => setPreferences((current) => ({ ...current, contrast: 'high' }))}>{text.high}</Choice>
          </PreferenceGroup>

          <PreferenceGroup label={text.motion}>
            <Choice active={preferences.motion === 'system'} onClick={() => setPreferences((current) => ({ ...current, motion: 'system' }))}>{text.motionSystem}</Choice>
            <Choice active={preferences.motion === 'reduced'} onClick={() => setPreferences((current) => ({ ...current, motion: 'reduced' }))}>{text.reduced}</Choice>
          </PreferenceGroup>
        </section>
      )}
    </div>
  );

  if (portalTarget) return createPortal(control, portalTarget);
  return createPortal(<div className="admin-appearance-floating">{control}</div>, document.body);
}

function PreferenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset className="admin-appearance-group"><legend>{label}</legend><div>{children}</div></fieldset>;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="admin-appearance-choice" data-active={active || undefined} aria-pressed={active} onClick={onClick}>{children}</button>;
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.4A8.3 8.3 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  );
}

function readPreferences(): AdminAppearancePreferences {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Partial<AdminAppearancePreferences>;
    return {
      theme: parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : DEFAULT_PREFERENCES.theme,
      density: parsed.density === 'compact' || parsed.density === 'comfortable' ? parsed.density : DEFAULT_PREFERENCES.density,
      contrast: parsed.contrast === 'high' || parsed.contrast === 'normal' ? parsed.contrast : DEFAULT_PREFERENCES.contrast,
      motion: parsed.motion === 'reduced' || parsed.motion === 'system' ? parsed.motion : DEFAULT_PREFERENCES.motion,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function applyPreferences(preferences: AdminAppearancePreferences) {
  const root = document.documentElement;
  const resolvedTheme = preferences.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preferences.theme;

  root.dataset.adminTheme = resolvedTheme;
  root.dataset.adminThemePreference = preferences.theme;
  root.dataset.adminDensity = preferences.density;
  root.dataset.adminContrast = preferences.contrast;
  root.dataset.adminMotion = preferences.motion;
  root.style.colorScheme = resolvedTheme;
  window.dispatchEvent(new CustomEvent('admin:appearance-change', { detail: { ...preferences, resolvedTheme } }));
}
