'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminNotice,
  AdminPage,
  AdminToolbar,
} from '../../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../../admin-locale';
import styles from '../game-control.module.css';

type HomeSection = 'featured' | 'popular' | 'online' | 'classic';
type HomePlatform = 'pc' | 'mobile';
type PlatformScope = HomePlatform | 'both';
type SelectionMode = 'auto' | 'manual' | 'hybrid';

type Provider = {
  id: string;
  name: string;
  code: string;
};

type Game = {
  id: string;
  providerId: string;
  providerGameCode: string;
  name: string;
  category: string;
  status: string;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  provider?: Pick<Provider, 'id' | 'name' | 'code'>;
};

type SectionSettings = {
  mode: SelectionMode;
  pc: string[];
  mobile: string[];
  limitPc: number;
  limitMobile: number;
};

type HomeSettings = {
  version: 1;
  sections: Record<HomeSection, SectionSettings>;
};

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  back: string;
  save: string;
  saving: string;
  loading: string;
  loadFailed: string;
  saved: string;
  saveFailed: string;
  noPermission: string;
  search: string;
  allProviders: string;
  platform: string;
  both: string;
  pc: string;
  mobile: string;
  mode: string;
  auto: string;
  manual: string;
  hybrid: string;
  limit: string;
  selected: string;
  catalog: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  emptySelected: string;
  emptyCatalog: string;
  autoHint: string;
  manualHint: string;
  hybridHint: string;
  sections: Record<HomeSection, string>;
};

const copy: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'แพลตฟอร์มเกม',
    title: 'ตั้งค่าเกมหน้าแรก',
    description: 'เลือกและเรียงเกมสำหรับ 4 แถบหน้าแรก โดยใช้ Game Catalog API ชุดเดียวกับ Desktop และ Mobile',
    back: 'กลับศูนย์ควบคุมเกม',
    save: 'บันทึกการตั้งค่า',
    saving: 'กำลังบันทึก',
    loading: 'กำลังโหลดเกมและการตั้งค่า...',
    loadFailed: 'โหลดข้อมูลไม่สำเร็จ',
    saved: 'บันทึกเกมหน้าแรกแล้ว',
    saveFailed: 'บันทึกไม่สำเร็จ',
    noPermission: 'บัญชีนี้ดูรายการได้ แต่ไม่มีสิทธิ์แก้ settings.features',
    search: 'ค้นหาชื่อเกม รหัส หรือค่าย',
    allProviders: 'ทุกค่าย',
    platform: 'แพลตฟอร์มที่กำลังจัด',
    both: 'PC และ Mobile',
    pc: 'PC',
    mobile: 'Mobile',
    mode: 'วิธีเลือกเกม',
    auto: 'อัตโนมัติ',
    manual: 'เลือกเอง',
    hybrid: 'ผสม',
    limit: 'จำนวนที่แสดง',
    selected: 'เกมที่เลือกและลำดับ',
    catalog: 'Game Catalog',
    add: 'เพิ่มเข้าแถบ',
    remove: 'เอาออก',
    moveUp: 'เลื่อนขึ้น',
    moveDown: 'เลื่อนลง',
    emptySelected: 'ยังไม่ได้เลือกเกม ระบบจะเติมตามโหมดอัตโนมัติเมื่อใช้โหมดผสม',
    emptyCatalog: 'ไม่พบเกมตามตัวกรอง',
    autoHint: 'เรียงเกมยอดนิยมจากรายชื่ออ้างอิง แท็ก HOT/Popular และจำนวนผู้เล่น แล้วสุ่ม API เติมให้ครบ',
    manualHint: 'แสดงเฉพาะเกมที่เลือกตามลำดับนี้',
    hybridHint: 'แสดงเกมที่เลือกก่อน แล้วใช้ระบบอัตโนมัติเติมให้ครบจำนวน',
    sections: { featured: 'เกมไฮไลท์', popular: 'เกมยอดนิยม', online: 'ผู้เล่นออนไลน์สูงสุด', classic: 'เกมคลาสสิก' },
  },
  en: {
    eyebrow: 'Game platform',
    title: 'Home game settings',
    description: 'Select and order games for the four home strips using the same Game Catalog API as Desktop and Mobile',
    back: 'Back to game control',
    save: 'Save settings',
    saving: 'Saving',
    loading: 'Loading games and settings...',
    loadFailed: 'Unable to load data',
    saved: 'Home game settings saved',
    saveFailed: 'Unable to save settings',
    noPermission: 'This account can view but cannot update settings.features',
    search: 'Search game, code, or provider',
    allProviders: 'All providers',
    platform: 'Editing platform',
    both: 'PC and Mobile',
    pc: 'PC',
    mobile: 'Mobile',
    mode: 'Selection mode',
    auto: 'Automatic',
    manual: 'Manual',
    hybrid: 'Hybrid',
    limit: 'Display limit',
    selected: 'Selected games and order',
    catalog: 'Game Catalog',
    add: 'Add to strip',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    emptySelected: 'No games selected. Hybrid mode fills the remaining slots automatically.',
    emptyCatalog: 'No games match the filters',
    autoHint: 'Ranks internet-popular names, HOT/Popular tags, and player counts, then fills remaining slots from the API',
    manualHint: 'Shows only selected games in this order',
    hybridHint: 'Shows selected games first and automatically fills the remaining slots',
    sections: { featured: 'Featured games', popular: 'Popular games', online: 'Most online', classic: 'Classic games' },
  },
};

const SETTINGS_KEY = 'home_game_sections_json';
const SECTION_KEYS: HomeSection[] = ['featured', 'popular', 'online', 'classic'];
const DEFAULT_LIMITS: Record<HomeSection, { pc: number; mobile: number }> = {
  featured: { pc: 8, mobile: 8 },
  popular: { pc: 10, mobile: 10 },
  online: { pc: 6, mobile: 6 },
  classic: { pc: 6, mobile: 12 },
};

export default function HomeGameSettingsPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [featureSettings, setFeatureSettings] = useState<Record<string, unknown>>({});
  const [settings, setSettings] = useState<HomeSettings>(defaultSettings());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [section, setSection] = useState<HomeSection>('featured');
  const [scope, setScope] = useState<PlatformScope>('both');
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { void load(); }, []);

  const canUpdate = permissions.includes('*') || permissions.includes('settings.features.update');
  const active = settings.sections[section];
  const selectedRefs = useMemo(() => selectedForScope(active, scope), [active, scope]);
  const selectedGames = useMemo(
    () => selectedRefs.map((reference) => games.find((game) => matchesGame(game, reference))).filter(Boolean) as Game[],
    [games, selectedRefs],
  );
  const visibleGames = useMemo(() => {
    const keyword = normalize(query);
    return games.filter((game) => {
      const haystack = normalize(`${game.name} ${game.providerGameCode} ${game.provider?.name ?? ''} ${game.provider?.code ?? ''}`);
      return game.status === 'ACTIVE'
        && (!keyword || haystack.includes(keyword))
        && (providerFilter === 'ALL' || game.providerId === providerFilter);
    });
  }, [games, providerFilter, query]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [gamesResponse, providersResponse, settingsResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/game-providers?take=100'),
        adminApiFetch('/admin/settings/features'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [gamesPayload, providersPayload, settingsPayload, mePayload] = await Promise.all([
        gamesResponse.json().catch(() => null),
        providersResponse.json().catch(() => null),
        settingsResponse.json().catch(() => null),
        meResponse.json().catch(() => null),
      ]);
      if (!gamesResponse.ok || !Array.isArray(gamesPayload?.items)) throw new Error('games');
      if (!providersResponse.ok || !Array.isArray(providersPayload?.items)) throw new Error('providers');
      if (!settingsResponse.ok || !isRecord(settingsPayload?.settings)) throw new Error('settings');

      const nextFeatures = settingsPayload.settings as Record<string, unknown>;
      setGames(gamesPayload.items as Game[]);
      setProviders(providersPayload.items as Provider[]);
      setFeatureSettings(nextFeatures);
      setSettings(parseSettings(nextFeatures[SETTINGS_KEY]));
      setPermissions(meResponse.ok && Array.isArray(mePayload?.permissions) ? mePayload.permissions : []);
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!canUpdate || saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const nextFeatures = {
        ...featureSettings,
        [SETTINGS_KEY]: JSON.stringify(settings, null, 2),
      };
      const response = await adminApiFetch('/admin/settings/features', {
        method: 'PUT',
        body: JSON.stringify(nextFeatures),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(isRecord(payload) && typeof payload.message === 'string' ? payload.message : t.saveFailed);
      const normalized = isRecord(payload?.settings) ? payload.settings as Record<string, unknown> : nextFeatures;
      setFeatureSettings(normalized);
      setSettings(parseSettings(normalized[SETTINGS_KEY]));
      setMessage(t.saved);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function updateActive(patch: Partial<SectionSettings>) {
    setSettings((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: { ...current.sections[section], ...patch },
      },
    }));
  }

  function toggleGame(game: Game) {
    const reference = gameReference(game);
    setSettings((current) => {
      const currentSection = current.sections[section];
      const platforms: HomePlatform[] = scope === 'both' ? ['pc', 'mobile'] : [scope];
      const nextSection = { ...currentSection };
      for (const platform of platforms) {
        const values = currentSection[platform];
        nextSection[platform] = values.includes(reference)
          ? values.filter((value) => value !== reference)
          : [...values, reference];
      }
      return { ...current, sections: { ...current.sections, [section]: nextSection } };
    });
  }

  function move(reference: string, direction: -1 | 1) {
    setSettings((current) => {
      const currentSection = current.sections[section];
      const platforms: HomePlatform[] = scope === 'both' ? ['pc', 'mobile'] : [scope];
      const nextSection = { ...currentSection };
      for (const platform of platforms) {
        const values = [...currentSection[platform]];
        const index = values.indexOf(reference);
        const target = index + direction;
        if (index >= 0 && target >= 0 && target < values.length) {
          [values[index], values[target]] = [values[target]!, values[index]!];
        }
        nextSection[platform] = values;
      }
      return { ...current, sections: { ...current.sections, [section]: nextSection } };
    });
  }

  const modeHint = active.mode === 'auto' ? t.autoHint : active.mode === 'manual' ? t.manualHint : t.hybridHint;

  return (
    <AdminPage
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      actions={<><a href="/game-control">{t.back}</a><AdminButton onClick={() => void save()} disabled={!canUpdate || loading || saving}>{saving ? t.saving : t.save}</AdminButton></>}
    >
      <div className={styles.workspace}>
        {loading && <AdminNotice>{t.loading}</AdminNotice>}
        {!loading && !canUpdate && <AdminNotice tone="warning">{t.noPermission}</AdminNotice>}
        {message && <AdminNotice tone="success">{message}</AdminNotice>}
        {error && <AdminNotice tone="danger">{error}<AdminButton size="compact" tone="ghost" onClick={() => void load()}>{t.loading}</AdminButton></AdminNotice>}

        <nav className={styles.tabs} aria-label={t.title}>
          {SECTION_KEYS.map((key) => (
            <button key={key} type="button" className={`${styles.tab} ${section === key ? styles.tabActive : ''}`} onClick={() => setSection(key)}>
              {t.sections[key]}
            </button>
          ))}
        </nav>

        <AdminCard title={t.sections[section]} description={modeHint}>
          <div className={styles.filters}>
            <label className={styles.meta}>{t.platform}
              <select className={styles.control} value={scope} onChange={(event) => setScope(event.target.value as PlatformScope)}>
                <option value="both">{t.both}</option><option value="pc">{t.pc}</option><option value="mobile">{t.mobile}</option>
              </select>
            </label>
            <label className={styles.meta}>{t.mode}
              <select className={styles.control} value={active.mode} onChange={(event) => updateActive({ mode: event.target.value as SelectionMode })} disabled={!canUpdate}>
                <option value="auto">{t.auto}</option><option value="manual">{t.manual}</option><option value="hybrid">{t.hybrid}</option>
              </select>
            </label>
            <label className={styles.meta}>{t.limit} PC
              <input className={styles.control} type="number" min={1} max={30} value={active.limitPc} onChange={(event) => updateActive({ limitPc: bounded(event.target.value, active.limitPc) })} disabled={!canUpdate} />
            </label>
            <label className={styles.meta}>{t.limit} Mobile
              <input className={styles.control} type="number" min={1} max={30} value={active.limitMobile} onChange={(event) => updateActive({ limitMobile: bounded(event.target.value, active.limitMobile) })} disabled={!canUpdate} />
            </label>
          </div>
        </AdminCard>

        <AdminCard title={t.selected} description={`${selectedRefs.length} ${t.sections[section]}`}>
          {selectedGames.length ? (
            <div className={styles.flagGrid}>
              {selectedGames.map((game, index) => {
                const reference = gameReference(game);
                return (
                  <article className={styles.flagCard} key={reference}>
                    <div className={styles.cardHead}><div><h3>{index + 1}. {game.name}</h3><p className={styles.meta}>{game.provider?.name ?? game.providerId} · {game.providerGameCode}</p></div><AdminBadge tone="success">{t.sections[section]}</AdminBadge></div>
                    <div className={styles.actions}>
                      <AdminButton size="compact" tone="ghost" disabled={!canUpdate || index === 0} onClick={() => move(reference, -1)}>↑ {t.moveUp}</AdminButton>
                      <AdminButton size="compact" tone="ghost" disabled={!canUpdate || index === selectedGames.length - 1} onClick={() => move(reference, 1)}>↓ {t.moveDown}</AdminButton>
                      <AdminButton size="compact" tone="danger" disabled={!canUpdate} onClick={() => toggleGame(game)}>{t.remove}</AdminButton>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <AdminEmpty>{t.emptySelected}</AdminEmpty>}
        </AdminCard>

        <AdminCard title={t.catalog} description={t.description}>
          <div className={styles.filters}>
            <input className={styles.control} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
            <select className={styles.control} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              <option value="ALL">{t.allProviders}</option>
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select>
          </div>
          <AdminToolbar><span className={styles.helper}>{visibleGames.length} {t.catalog}</span></AdminToolbar>
          {visibleGames.length ? (
            <div className={styles.flagGrid}>
              {visibleGames.map((game) => {
                const selected = selectedRefs.includes(gameReference(game));
                return (
                  <article className={styles.flagCard} key={game.id}>
                    <div className={styles.cardHead}><div><h3>{game.name}</h3><p className={styles.meta}>{game.provider?.name ?? game.providerId} · {game.category}</p></div>{selected && <AdminBadge tone="success">{t.selected}</AdminBadge>}</div>
                    <div className={styles.statusRow}>{game.isFeatured && <AdminBadge>Featured</AdminBadge>}{game.isPopular && <AdminBadge tone="warning">Popular</AdminBadge>}{game.isNew && <AdminBadge tone="success">New</AdminBadge>}</div>
                    <div className={styles.actions}><AdminButton size="compact" tone={selected ? 'danger' : 'success'} disabled={!canUpdate} onClick={() => toggleGame(game)}>{selected ? t.remove : t.add}</AdminButton></div>
                  </article>
                );
              })}
            </div>
          ) : <AdminEmpty>{t.emptyCatalog}</AdminEmpty>}
        </AdminCard>
      </div>
    </AdminPage>
  );
}

function defaultSettings(): HomeSettings {
  return {
    version: 1,
    sections: Object.fromEntries(SECTION_KEYS.map((section) => [section, {
      mode: 'hybrid',
      pc: [],
      mobile: [],
      limitPc: DEFAULT_LIMITS[section].pc,
      limitMobile: DEFAULT_LIMITS[section].mobile,
    }])) as HomeSettings['sections'],
  };
}

function parseSettings(value: unknown): HomeSettings {
  const defaults = defaultSettings();
  let parsed: unknown = value;
  if (typeof value === 'string' && value.trim()) {
    try { parsed = JSON.parse(value); } catch { parsed = {}; }
  }
  const source = isRecord(parsed) ? parsed : {};
  const sections = isRecord(source.sections) ? source.sections : {};
  for (const section of SECTION_KEYS) {
    const item = isRecord(sections[section]) ? sections[section] : {};
    defaults.sections[section] = {
      mode: item.mode === 'auto' || item.mode === 'manual' || item.mode === 'hybrid' ? item.mode : 'hybrid',
      pc: stringList(item.pc),
      mobile: stringList(item.mobile),
      limitPc: bounded(item.limitPc, DEFAULT_LIMITS[section].pc),
      limitMobile: bounded(item.limitMobile, DEFAULT_LIMITS[section].mobile),
    };
  }
  return defaults;
}

function selectedForScope(settings: SectionSettings, scope: PlatformScope) {
  return scope === 'both' ? [...new Set([...settings.pc, ...settings.mobile])] : settings[scope];
}

function gameReference(game: Game) {
  return normalize(`${game.provider?.code ?? game.providerId}:${game.providerGameCode || game.id}`);
}

function matchesGame(game: Game, reference: string) {
  const normalized = normalize(reference);
  return [gameReference(game), normalize(game.id), normalize(game.providerGameCode), normalize(game.name)].includes(normalized);
}

function stringList(value: unknown) {
  return [...new Set((Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === 'string')
    .map(normalize)
    .filter(Boolean))].slice(0, 40);
}

function bounded(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(30, Math.max(1, Math.round(number))) : fallback;
}

function normalize(value: string) {
  return value.toLocaleLowerCase('en-US').replace(/[^a-z0-9ก-๙]+/g, ' ').trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
