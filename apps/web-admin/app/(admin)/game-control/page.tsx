'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminToolbar,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import styles from './game-control.module.css';

type GameStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type ProviderHealth = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
type TabKey = 'overview' | 'home' | 'games' | 'providers' | 'competition' | 'maintenance';

type Provider = {
  id: string;
  name: string;
  code: string;
  status: ProviderStatus;
  walletMode?: string;
  currency?: string;
  _count?: { games?: number; endpoints?: number; credentials?: number; sessions?: number };
};

type Game = {
  id: string;
  providerId: string;
  providerGameCode: string;
  name: string;
  category: string;
  status: GameStatus;
  sortOrder: number;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  metadata?: unknown;
  provider?: Pick<Provider, 'id' | 'name' | 'code' | 'status'>;
};

type PendingAction =
  | { kind: 'game'; game: Game; status: GameStatus }
  | { kind: 'provider'; provider: Provider; status: ProviderStatus }
  | { kind: 'bulk'; games: Game[]; status: GameStatus };

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  refreshing: string;
  retry: string;
  noPermission: string;
  tabs: Record<TabKey, string>;
  totalGames: string;
  availableGames: string;
  blockedGames: string;
  homeGames: string;
  providersReady: string;
  overviewTitle: string;
  overviewDescription: string;
  healthy: string;
  attention: string;
  adminEnabled: string;
  adminDisabled: string;
  maintenanceGames: string;
  providerIssues: string;
  homeTitle: string;
  homeDescription: string;
  gamesTitle: string;
  gamesDescription: string;
  providersTitle: string;
  providersDescription: string;
  competitionTitle: string;
  competitionDescription: string;
  maintenanceTitle: string;
  maintenanceDescription: string;
  search: string;
  allProviders: string;
  allStatuses: string;
  allCategories: string;
  visible: string;
  selected: string;
  selectVisible: string;
  clearSelection: string;
  activateSelected: string;
  maintainSelected: string;
  disableSelected: string;
  game: string;
  provider: string;
  category: string;
  adminStatus: string;
  providerStatus: string;
  effectiveStatus: string;
  display: string;
  actions: string;
  activate: string;
  disable: string;
  maintenance: string;
  healthCheck: string;
  syncGames: string;
  providerSettings: string;
  featureSettings: string;
  addHome: string;
  removeHome: string;
  markPopular: string;
  removePopular: string;
  markNew: string;
  removeNew: string;
  noGames: string;
  noProviders: string;
  saved: string;
  failed: string;
  healthUpdated: string;
  syncCompleted: string;
  confirmTitle: string;
  confirmDescription: string;
  confirm: string;
  cancel: string;
  affectedGames: string;
  useVisibleGames: string;
};

const copy: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'แพลตฟอร์มเกม',
    title: 'ศูนย์ควบคุมเกม',
    description: 'ควบคุมเกมหน้าแรก รายการเกม ค่ายเกม API และการปิดปรับปรุงจากจุดเดียว',
    refresh: 'อัปเดตข้อมูล', refreshing: 'กำลังอัปเดต', retry: 'ลองใหม่',
    noPermission: 'บัญชีนี้ดูข้อมูลได้ แต่ไม่มีสิทธิ์เปลี่ยนการตั้งค่าเกม',
    tabs: { overview: 'ภาพรวม', home: 'เกมหน้าแรก', games: 'เกมทั้งหมด', providers: 'ค่ายเกม / API', competition: 'Tournament / Leaderboard', maintenance: 'ปิดระบบ / Maintenance' },
    totalGames: 'เกมทั้งหมด', availableGames: 'พร้อมให้บริการ', blockedGames: 'Provider ปิดกั้น', homeGames: 'เกมหน้าแรก', providersReady: 'ค่ายพร้อมใช้',
    overviewTitle: 'สถานะระบบเกม', overviewDescription: 'สถานะใช้งานจริงคำนวณจากสถานะ Admin ค่ายเกม และสถานะล่าสุดจาก Provider', healthy: 'ระบบเกมพร้อมให้บริการตามปกติ', attention: 'มีรายการที่ต้องตรวจสอบ', adminEnabled: 'Admin เปิดใช้', adminDisabled: 'Admin ปิดใช้', maintenanceGames: 'เกมปิดปรับปรุง', providerIssues: 'ค่ายมีปัญหา',
    homeTitle: 'จัดเกมหน้าแรก', homeDescription: 'กำหนด Featured, Popular และ New จากข้อมูลเกมจริง', gamesTitle: 'ควบคุมเกมทั้งหมด', gamesDescription: 'ค้นหา กรอง เปิด ปิด และปิดปรับปรุงรายเกมหรือหลายเกมพร้อมกัน', providersTitle: 'ค่ายเกมและ API', providersDescription: 'ตรวจสุขภาพ ซิงก์เกม และรักษาสิทธิ์การควบคุมของ Admin', competitionTitle: 'Tournament และ Leaderboard', competitionDescription: 'จัดกลุ่มเกมเด่น ยอดนิยม และเกมใหม่สำหรับพื้นที่แข่งขันและอันดับ', maintenanceTitle: 'ศูนย์ปิดปรับปรุง', maintenanceDescription: 'เห็นจำนวนเกมที่ได้รับผลกระทบก่อนปิดเกมหรือค่าย',
    search: 'ค้นหาชื่อเกม รหัสเกม หรือค่าย', allProviders: 'ทุกค่าย', allStatuses: 'ทุกสถานะ', allCategories: 'ทุกหมวด', visible: 'เกมที่แสดง', selected: 'เลือกแล้ว', selectVisible: 'เลือกที่แสดง', clearSelection: 'ล้างที่เลือก', activateSelected: 'เปิดเกมที่เลือก', maintainSelected: 'ปิดปรับปรุงที่เลือก', disableSelected: 'ปิดเกมที่เลือก',
    game: 'เกม', provider: 'ค่าย', category: 'หมวด', adminStatus: 'สถานะ Admin', providerStatus: 'สถานะ Provider', effectiveStatus: 'สถานะใช้งานจริง', display: 'การแสดงผล', actions: 'คำสั่ง', activate: 'เปิดใช้งาน', disable: 'ปิดใช้งาน', maintenance: 'ปิดปรับปรุง', healthCheck: 'ตรวจสุขภาพ', syncGames: 'ซิงก์เกม', providerSettings: 'ตั้งค่าค่าย', featureSettings: 'ตั้งค่าฟีเจอร์', addHome: 'ขึ้นหน้าแรก', removeHome: 'เอาออกจากหน้าแรก', markPopular: 'ทำเป็นยอดนิยม', removePopular: 'เลิกเป็นยอดนิยม', markNew: 'ทำเป็นเกมใหม่', removeNew: 'เลิกเป็นเกมใหม่',
    noGames: 'ไม่พบเกมตามตัวกรอง', noProviders: 'ไม่พบข้อมูลค่ายเกม', saved: 'บันทึกการเปลี่ยนแปลงแล้ว', failed: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่', healthUpdated: 'อัปเดตผลตรวจสุขภาพค่ายแล้ว', syncCompleted: 'ซิงก์รายชื่อเกมแล้ว', confirmTitle: 'ยืนยันการเปลี่ยนสถานะ', confirmDescription: 'สถานะนี้จะมีผลทันที และ Member API จะตรวจซ้ำก่อนเปิดเกม', confirm: 'ยืนยัน', cancel: 'ยกเลิก', affectedGames: 'เกมที่ได้รับผลกระทบ', useVisibleGames: 'ยังไม่ได้เลือกเกม ระบบจะใช้เกมที่แสดงอยู่',
  },
  en: {
    eyebrow: 'Game platform',
    title: 'Game control center',
    description: 'Control home games, catalog, providers, API health, and maintenance from one workspace',
    refresh: 'Refresh data', refreshing: 'Refreshing', retry: 'Retry',
    noPermission: 'This account can view data but cannot change game settings',
    tabs: { overview: 'Overview', home: 'Home games', games: 'All games', providers: 'Providers / API', competition: 'Tournament / Leaderboard', maintenance: 'Shutdown / Maintenance' },
    totalGames: 'Total games', availableGames: 'Available', blockedGames: 'Provider blocked', homeGames: 'Home games', providersReady: 'Providers ready',
    overviewTitle: 'Game system status', overviewDescription: 'Effective availability combines Admin, provider, and latest reported game status', healthy: 'The game system is operating normally', attention: 'Items require review', adminEnabled: 'Admin enabled', adminDisabled: 'Admin disabled', maintenanceGames: 'Game maintenance', providerIssues: 'Provider issues',
    homeTitle: 'Manage home games', homeDescription: 'Set Featured, Popular, and New using live catalog data', gamesTitle: 'Control all games', gamesDescription: 'Search, filter, enable, disable, or maintain individual and selected games', providersTitle: 'Providers and API', providersDescription: 'Run health checks, sync games, and retain Admin control', competitionTitle: 'Tournament and leaderboard', competitionDescription: 'Organize featured, popular, and new games for competition and ranking surfaces', maintenanceTitle: 'Maintenance center', maintenanceDescription: 'Review affected-game counts before disabling games or providers',
    search: 'Search game, code, or provider', allProviders: 'All providers', allStatuses: 'All statuses', allCategories: 'All categories', visible: 'visible games', selected: 'selected', selectVisible: 'Select visible', clearSelection: 'Clear selection', activateSelected: 'Activate selected', maintainSelected: 'Maintain selected', disableSelected: 'Disable selected',
    game: 'Game', provider: 'Provider', category: 'Category', adminStatus: 'Admin status', providerStatus: 'Provider status', effectiveStatus: 'Effective status', display: 'Display', actions: 'Actions', activate: 'Activate', disable: 'Disable', maintenance: 'Maintenance', healthCheck: 'Health check', syncGames: 'Sync games', providerSettings: 'Provider settings', featureSettings: 'Feature settings', addHome: 'Add to home', removeHome: 'Remove from home', markPopular: 'Mark popular', removePopular: 'Unmark popular', markNew: 'Mark new', removeNew: 'Unmark new',
    noGames: 'No games match the filters', noProviders: 'No provider data', saved: 'Changes saved', failed: 'Action failed. Please try again', healthUpdated: 'Provider health result updated', syncCompleted: 'Game catalog synced', confirmTitle: 'Confirm status change', confirmDescription: 'The status takes effect immediately and the Member API rechecks it before launch', confirm: 'Confirm', cancel: 'Cancel', affectedGames: 'Affected games', useVisibleGames: 'No games selected. Visible games will be used',
  },
};

const gameStatuses: GameStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REMOVED'];

export default function GameControlPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const [tab, setTab] = useState<TabKey>('overview');
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [health, setHealth] = useState<Record<string, ProviderHealth>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GameStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => { void loadAll(); }, []);

  const canManage = permissions.includes('*') || permissions.includes('game.providers.manage') || permissions.includes('provider.update');
  const categories = useMemo(() => [...new Set(games.map((game) => game.category).filter(Boolean))].sort(), [games]);
  const visibleGames = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase(locale === 'th' ? 'th' : 'en');
    return games.filter((game) => {
      const text = `${game.name} ${game.providerGameCode} ${game.provider?.name ?? ''} ${game.provider?.code ?? ''}`.toLocaleLowerCase(locale === 'th' ? 'th' : 'en');
      return (!keyword || text.includes(keyword))
        && (providerFilter === 'ALL' || game.providerId === providerFilter)
        && (statusFilter === 'ALL' || game.status === statusFilter)
        && (categoryFilter === 'ALL' || game.category === categoryFilter);
    });
  }, [games, query, providerFilter, statusFilter, categoryFilter, locale]);
  const selectedGames = useMemo(() => games.filter((game) => selectedIds.includes(game.id)), [games, selectedIds]);
  const blockedGames = useMemo(() => games.filter((game) => game.status === 'ACTIVE' && effectiveGameStatus(game) !== 'ACTIVE'), [games]);
  const issueProviders = useMemo(() => providers.filter((provider) => provider.status !== 'ACTIVE' || ['OFFLINE', 'DEGRADED'].includes(health[provider.id] ?? 'UNKNOWN')), [providers, health]);
  const metrics = useMemo(() => ({
    total: games.length,
    available: games.filter((game) => effectiveGameStatus(game) === 'ACTIVE').length,
    blocked: blockedGames.length,
    featured: games.filter((game) => game.isFeatured).length,
    providersReady: providers.filter((provider) => provider.status === 'ACTIVE' && !['OFFLINE', 'DEGRADED'].includes(health[provider.id] ?? 'UNKNOWN')).length,
  }), [games, providers, health, blockedGames]);
  const pageBusy = loading || Boolean(busyKey);

  async function loadAll() {
    setLoading(true);
    setIsError(false);
    setMessage('');
    try {
      const [gamesResponse, providersResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/game-providers?take=100'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [gamesData, providersData, meData] = await Promise.all([
        gamesResponse.json().catch(() => null),
        providersResponse.json().catch(() => null),
        meResponse.json().catch(() => null),
      ]);
      if (!gamesResponse.ok || !Array.isArray(gamesData?.items)) throw new Error('games');
      if (!providersResponse.ok || !Array.isArray(providersData?.items)) throw new Error('providers');
      const nextGames = gamesData.items as Game[];
      setGames(nextGames);
      setProviders(providersData.items as Provider[]);
      setPermissions(meResponse.ok && Array.isArray(meData?.permissions) ? meData.permissions : []);
      setSelectedIds((current) => current.filter((id) => nextGames.some((game) => game.id === id)));
    } catch {
      setIsError(true);
      setMessage(t.failed);
    } finally {
      setLoading(false);
    }
  }

  async function patchGame(game: Game, patch: Partial<Pick<Game, 'status' | 'isFeatured' | 'isPopular' | 'isNew'>>) {
    if (!canManage || busyKey) return false;
    setBusyKey(`game:${game.id}`);
    setIsError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/games/${game.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('game');
      setGames((current) => current.map((item) => item.id === game.id ? { ...item, ...payload } : item));
      setMessage(t.saved);
      return true;
    } catch {
      setIsError(true);
      setMessage(t.failed);
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function patchProvider(provider: Provider, status: ProviderStatus) {
    if (!canManage || busyKey) return false;
    setBusyKey(`provider:${provider.id}`);
    setIsError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('provider');
      setMessage(t.saved);
      await loadAll();
      return true;
    } catch {
      setIsError(true);
      setMessage(t.failed);
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function runProviderAction(provider: Provider, action: 'health-check' | 'sync-games') {
    if (!canManage || busyKey) return;
    setBusyKey(`${action}:${provider.id}`);
    setIsError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}/${action}`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(action);
      if (action === 'health-check') {
        setHealth((current) => ({ ...current, [provider.id]: normalizeHealth(payload?.payload?.status) }));
        setMessage(t.healthUpdated);
      } else {
        setMessage(t.syncCompleted);
        await loadAll();
      }
    } catch {
      setIsError(true);
      setMessage(t.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function patchMany(targets: Game[], status: GameStatus) {
    if (!canManage || busyKey || targets.length === 0) return;
    setBusyKey('bulk');
    setIsError(false);
    let failed = 0;
    for (const game of targets) {
      try {
        const response = await adminApiFetch(`/admin/games/${game.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBusyKey('');
    setSelectedIds([]);
    setPending(null);
    setIsError(failed > 0);
    setMessage(failed ? `${t.failed} (${failed}/${targets.length})` : t.saved);
    await loadAll();
  }

  async function confirmPending() {
    if (!pending || busyKey) return;
    if (pending.kind === 'game') {
      if (await patchGame(pending.game, { status: pending.status })) setPending(null);
      return;
    }
    if (pending.kind === 'provider') {
      if (await patchProvider(pending.provider, pending.status)) setPending(null);
      return;
    }
    await patchMany(pending.games, pending.status);
  }

  function toggleSelected(id: string) {
    if (pageBusy) return;
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleVisible() {
    if (pageBusy) return;
    setSelectedIds((current) => visibleGames.every((game) => current.includes(game.id))
      ? current.filter((id) => !visibleGames.some((game) => game.id === id))
      : [...new Set([...current, ...visibleGames.map((game) => game.id)])]);
  }

  const pendingCount = pending?.kind === 'bulk' ? pending.games.length : pending ? 1 : 0;
  const pendingStatus = pending?.status ?? 'INACTIVE';
  const pendingTone = pendingStatus === 'ACTIVE' ? 'success' : pendingStatus === 'MAINTENANCE' || pendingStatus === 'DEGRADED' ? 'primary' : 'danger';

  return <AdminPage
    eyebrow={t.eyebrow}
    title={t.title}
    description={t.description}
    actions={<AdminButton onClick={() => void loadAll()} disabled={pageBusy}>{loading ? t.refreshing : t.refresh}</AdminButton>}
  >
    <div className={styles.workspace}>
      <AdminMetricGrid>
        <AdminMetric title={t.totalGames} value={String(metrics.total)} />
        <AdminMetric title={t.availableGames} value={String(metrics.available)} tone="success" />
        <AdminMetric title={t.blockedGames} value={String(metrics.blocked)} tone={metrics.blocked ? 'warning' : 'success'} />
        <AdminMetric title={t.homeGames} value={String(metrics.featured)} tone="brand" />
        <AdminMetric title={t.providersReady} value={`${metrics.providersReady}/${providers.length}`} tone={metrics.providersReady === providers.length ? 'success' : 'warning'} />
      </AdminMetricGrid>

      {!loading && !canManage && <AdminNotice tone="warning">{t.noPermission}</AdminNotice>}
      {message && <AdminNotice tone={isError ? 'danger' : 'success'}>{message}{isError && <AdminButton size="compact" tone="ghost" onClick={() => void loadAll()}>{t.retry}</AdminButton>}</AdminNotice>}

      <nav className={styles.tabs} aria-label={t.title}>
        {(Object.keys(t.tabs) as TabKey[]).map((key) => <button key={key} type="button" className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>{t.tabs[key]}</button>)}
      </nav>

      {tab === 'overview' && <OverviewTab t={t} games={games} providers={providers} health={health} blockedGames={blockedGames} issueProviders={issueProviders} loading={loading} />}
      {tab === 'home' && <FlagWorkspace t={t} title={t.homeTitle} description={t.homeDescription} games={visibleGames} providers={providers} loading={loading} disabled={Boolean(busyKey) || !canManage} query={query} setQuery={setQuery} providerFilter={providerFilter} setProviderFilter={setProviderFilter} onPatch={patchGame} />}
      {tab === 'games' && <GamesTab t={t} games={visibleGames} providers={providers} categories={categories} loading={loading} busy={Boolean(busyKey)} canManage={canManage} query={query} setQuery={setQuery} providerFilter={providerFilter} setProviderFilter={setProviderFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} selectedIds={selectedIds} setSelectedIds={setSelectedIds} toggleSelected={toggleSelected} toggleVisible={toggleVisible} setPending={setPending} />}
      {tab === 'providers' && <ProvidersTab t={t} providers={providers} games={games} health={health} loading={loading} busy={Boolean(busyKey)} canManage={canManage} onAction={runProviderAction} setPending={setPending} />}
      {tab === 'competition' && <FlagWorkspace t={t} title={t.competitionTitle} description={t.competitionDescription} action={<AdminLinkButton href="/settings/features" tone="ghost" size="compact">{t.featureSettings}</AdminLinkButton>} games={[...visibleGames].sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)} providers={providers} loading={loading} disabled={Boolean(busyKey) || !canManage} query={query} setQuery={setQuery} providerFilter={providerFilter} setProviderFilter={setProviderFilter} onPatch={patchGame} />}
      {tab === 'maintenance' && <MaintenanceTab t={t} games={games} providers={providers} visibleGames={visibleGames} selectedGames={selectedGames} loading={loading} canManage={canManage} setPending={setPending} />}
    </div>

    <AdminConfirmDialog
      open={Boolean(pending)}
      title={t.confirmTitle}
      description={`${t.confirmDescription} (${pendingCount})`}
      confirmLabel={t.confirm}
      cancelLabel={t.cancel}
      tone={pendingTone}
      busy={Boolean(busyKey)}
      details={<StatusBadge status={pendingStatus} />}
      onConfirm={() => void confirmPending()}
      onCancel={() => { if (!busyKey) setPending(null); }}
    />
  </AdminPage>;
}

function OverviewTab({ t, games, providers, health, blockedGames, issueProviders, loading }: { t: Copy; games: Game[]; providers: Provider[]; health: Record<string, ProviderHealth>; blockedGames: Game[]; issueProviders: Provider[]; loading: boolean }) {
  if (loading) return <AdminNotice>{t.refreshing}</AdminNotice>;
  return <div className={styles.grid}>
    <AdminCard title={t.overviewTitle} description={t.overviewDescription} tone={blockedGames.length || issueProviders.length ? 'warning' : 'success'}>
      <AdminNotice tone={blockedGames.length || issueProviders.length ? 'warning' : 'success'}>{blockedGames.length || issueProviders.length ? t.attention : t.healthy}</AdminNotice>
      <div className={styles.summaryGrid}>
        <Summary label={t.adminEnabled} value={games.filter((game) => game.status === 'ACTIVE').length} />
        <Summary label={t.adminDisabled} value={games.filter((game) => game.status === 'INACTIVE' || game.status === 'REMOVED').length} />
        <Summary label={t.maintenanceGames} value={games.filter((game) => game.status === 'MAINTENANCE').length} />
        <Summary label={t.blockedGames} value={blockedGames.length} />
      </div>
    </AdminCard>
    <AdminCard title={t.providerIssues} description={t.providersDescription} tone={issueProviders.length ? 'warning' : 'success'}>
      {issueProviders.length ? <div className={styles.summaryGrid}>{issueProviders.map((provider) => <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><span>{provider.code}</span><div className={styles.statusRow}><StatusBadge status={provider.status} /><StatusBadge status={health[provider.id] ?? 'UNKNOWN'} /></div></div>)}</div> : <AdminEmpty>{t.healthy}</AdminEmpty>}
    </AdminCard>
    <AdminCard title={t.blockedGames} description={t.overviewDescription} tone={blockedGames.length ? 'warning' : 'success'}>
      {blockedGames.length ? <div className={styles.summaryGrid}>{blockedGames.slice(0, 16).map((game) => <div key={game.id} className={styles.summaryItem}><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerId}</span><div className={styles.statusRow}><StatusBadge status={game.status} /><StatusBadge status={reportedGameStatus(game)} /><StatusBadge status={effectiveGameStatus(game)} /></div></div>)}</div> : <AdminEmpty>{t.healthy}</AdminEmpty>}
    </AdminCard>
    <AdminCard title={t.providersTitle} description={t.providersDescription}>
      {providers.length ? <div className={styles.summaryGrid}>{providers.slice(0, 16).map((provider) => <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><span>{provider._count?.games ?? 0} {t.game}</span><div className={styles.statusRow}><StatusBadge status={provider.status} /><StatusBadge status={health[provider.id] ?? 'UNKNOWN'} /></div></div>)}</div> : <AdminEmpty>{t.noProviders}</AdminEmpty>}
    </AdminCard>
  </div>;
}

function FlagWorkspace({ t, title, description, action, games, providers, loading, disabled, query, setQuery, providerFilter, setProviderFilter, onPatch }: { t: Copy; title: string; description: string; action?: React.ReactNode; games: Game[]; providers: Provider[]; loading: boolean; disabled: boolean; query: string; setQuery: (value: string) => void; providerFilter: string; setProviderFilter: (value: string) => void; onPatch: (game: Game, patch: Partial<Pick<Game, 'isFeatured' | 'isPopular' | 'isNew'>>) => Promise<boolean> }) {
  return <AdminCard title={title} description={description} action={action}>
    <SimpleFilters t={t} query={query} setQuery={setQuery} providers={providers} providerFilter={providerFilter} setProviderFilter={setProviderFilter} />
    {loading ? <AdminNotice>{t.refreshing}</AdminNotice> : games.length ? <div className={styles.flagGrid}>{games.map((game) => <FlagCard key={game.id} t={t} game={game} disabled={disabled} onPatch={onPatch} />)}</div> : <AdminEmpty>{t.noGames}</AdminEmpty>}
  </AdminCard>;
}

function FlagCard({ t, game, disabled, onPatch }: { t: Copy; game: Game; disabled: boolean; onPatch: (game: Game, patch: Partial<Pick<Game, 'isFeatured' | 'isPopular' | 'isNew'>>) => Promise<boolean> }) {
  return <article className={styles.flagCard}>
    <div className={styles.cardHead}><div><h3>{game.name}</h3><p className={styles.meta}>{game.provider?.name ?? game.providerId} · {game.category}</p></div><StatusBadge status={effectiveGameStatus(game)} /></div>
    <div className={styles.statusRow}>{game.isFeatured && <AdminBadge tone="success">Featured</AdminBadge>}{game.isPopular && <AdminBadge tone="warning">Popular</AdminBadge>}{game.isNew && <AdminBadge>New</AdminBadge>}</div>
    <div className={styles.actions}><AdminButton size="compact" tone={game.isFeatured ? 'success' : 'ghost'} disabled={disabled} onClick={() => void onPatch(game, { isFeatured: !game.isFeatured })}>{game.isFeatured ? t.removeHome : t.addHome}</AdminButton><AdminButton size="compact" tone={game.isPopular ? 'success' : 'ghost'} disabled={disabled} onClick={() => void onPatch(game, { isPopular: !game.isPopular })}>{game.isPopular ? t.removePopular : t.markPopular}</AdminButton><AdminButton size="compact" tone={game.isNew ? 'success' : 'ghost'} disabled={disabled} onClick={() => void onPatch(game, { isNew: !game.isNew })}>{game.isNew ? t.removeNew : t.markNew}</AdminButton></div>
  </article>;
}

function GamesTab({ t, games, providers, categories, loading, busy, canManage, query, setQuery, providerFilter, setProviderFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, selectedIds, setSelectedIds, toggleSelected, toggleVisible, setPending }: { t: Copy; games: Game[]; providers: Provider[]; categories: string[]; loading: boolean; busy: boolean; canManage: boolean; query: string; setQuery: (value: string) => void; providerFilter: string; setProviderFilter: (value: string) => void; statusFilter: 'ALL' | GameStatus; setStatusFilter: (value: 'ALL' | GameStatus) => void; categoryFilter: string; setCategoryFilter: (value: string) => void; selectedIds: string[]; setSelectedIds: (value: string[]) => void; toggleSelected: (id: string) => void; toggleVisible: () => void; setPending: (value: PendingAction | null) => void }) {
  const selected = games.filter((game) => selectedIds.includes(game.id));
  return <AdminCard title={t.gamesTitle} description={t.gamesDescription}>
    <div className={styles.filters}><input className={styles.control} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><select className={styles.control} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}><option value="ALL">{t.allProviders}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select><select className={styles.control} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | GameStatus)}><option value="ALL">{t.allStatuses}</option>{gameStatuses.map((status) => <option key={status}>{status}</option>)}</select><select className={styles.control} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="ALL">{t.allCategories}</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
    <AdminToolbar><span className={styles.helper}>{games.length} {t.visible} · {selectedIds.length} {t.selected}</span><AdminButton size="compact" tone="ghost" disabled={busy || games.length === 0} onClick={toggleVisible}>{t.selectVisible}</AdminButton><AdminButton size="compact" tone="ghost" disabled={busy || selectedIds.length === 0} onClick={() => setSelectedIds([])}>{t.clearSelection}</AdminButton><AdminButton size="compact" tone="success" disabled={busy || !canManage || selected.length === 0} onClick={() => setPending({ kind: 'bulk', games: selected, status: 'ACTIVE' })}>{t.activateSelected}</AdminButton><AdminButton size="compact" tone="secondary" disabled={busy || !canManage || selected.length === 0} onClick={() => setPending({ kind: 'bulk', games: selected, status: 'MAINTENANCE' })}>{t.maintainSelected}</AdminButton><AdminButton size="compact" tone="danger" disabled={busy || !canManage || selected.length === 0} onClick={() => setPending({ kind: 'bulk', games: selected, status: 'INACTIVE' })}>{t.disableSelected}</AdminButton></AdminToolbar>
    {loading ? <AdminNotice>{t.refreshing}</AdminNotice> : games.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.checkboxCell}><input className={styles.checkbox} type="checkbox" checked={games.length > 0 && games.every((game) => selectedIds.includes(game.id))} onChange={toggleVisible} /></th><th>{t.game}</th><th>{t.provider}</th><th>{t.category}</th><th>{t.adminStatus}</th><th>{t.providerStatus}</th><th>{t.effectiveStatus}</th><th>{t.display}</th><th>{t.actions}</th></tr></thead><tbody>{games.map((game) => <tr key={game.id}><td className={styles.checkboxCell}><input className={styles.checkbox} type="checkbox" checked={selectedIds.includes(game.id)} onChange={() => toggleSelected(game.id)} /></td><td><div className={styles.nameCell}><strong>{game.name}</strong><span className={styles.code}>{game.providerGameCode}</span></div></td><td>{game.provider?.name ?? game.providerId}</td><td>{game.category}</td><td><StatusBadge status={game.status} /></td><td><StatusBadge status={reportedGameStatus(game)} /></td><td><StatusBadge status={effectiveGameStatus(game)} /></td><td><div className={styles.statusRow}>{game.isFeatured && <AdminBadge tone="success">F</AdminBadge>}{game.isPopular && <AdminBadge tone="warning">P</AdminBadge>}{game.isNew && <AdminBadge>N</AdminBadge>}</div></td><td><div className={styles.actions}><AdminButton size="compact" tone="success" disabled={busy || !canManage || game.status === 'ACTIVE'} onClick={() => setPending({ kind: 'game', game, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="secondary" disabled={busy || !canManage || game.status === 'MAINTENANCE'} onClick={() => setPending({ kind: 'game', game, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton><AdminButton size="compact" tone="danger" disabled={busy || !canManage || game.status === 'INACTIVE'} onClick={() => setPending({ kind: 'game', game, status: 'INACTIVE' })}>{t.disable}</AdminButton></div></td></tr>)}</tbody></table></div> : <AdminEmpty>{t.noGames}</AdminEmpty>}
  </AdminCard>;
}

function ProvidersTab({ t, providers, games, health, loading, busy, canManage, onAction, setPending }: { t: Copy; providers: Provider[]; games: Game[]; health: Record<string, ProviderHealth>; loading: boolean; busy: boolean; canManage: boolean; onAction: (provider: Provider, action: 'health-check' | 'sync-games') => Promise<void>; setPending: (value: PendingAction | null) => void }) {
  return <AdminCard title={t.providersTitle} description={t.providersDescription} action={<AdminLinkButton href="/simple-game-settings" tone="ghost" size="compact">{t.providerSettings}</AdminLinkButton>}>
    {loading ? <AdminNotice>{t.refreshing}</AdminNotice> : providers.length ? <div className={styles.providerGrid}>{providers.map((provider) => { const affected = games.filter((game) => game.providerId === provider.id).length; return <article key={provider.id} className={styles.providerCard}><div className={styles.cardHead}><div><h3>{provider.name}</h3><p className={styles.meta}>{provider.code} · {affected} {t.game}</p></div><StatusBadge status={health[provider.id] ?? 'UNKNOWN'} /></div><div className={styles.statusRow}><StatusBadge status={provider.status} /><span className={styles.helper}>{provider.walletMode ?? '-'} · {provider.currency ?? '-'}</span></div><p className={styles.helper}>API {provider._count?.endpoints ?? 0} · Credentials {provider._count?.credentials ?? 0} · Sessions {provider._count?.sessions ?? 0}</p><div className={styles.actions}><AdminButton size="compact" tone="ghost" disabled={busy || !canManage} onClick={() => void onAction(provider, 'health-check')}>{t.healthCheck}</AdminButton><AdminButton size="compact" tone="secondary" disabled={busy || !canManage} onClick={() => void onAction(provider, 'sync-games')}>{t.syncGames}</AdminButton><AdminButton size="compact" tone="success" disabled={busy || !canManage || provider.status === 'ACTIVE'} onClick={() => setPending({ kind: 'provider', provider, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="danger" disabled={busy || !canManage || provider.status === 'MAINTENANCE'} onClick={() => setPending({ kind: 'provider', provider, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton></div></article>; })}</div> : <AdminEmpty>{t.noProviders}</AdminEmpty>}
  </AdminCard>;
}

function MaintenanceTab({ t, games, providers, visibleGames, selectedGames, loading, canManage, setPending }: { t: Copy; games: Game[]; providers: Provider[]; visibleGames: Game[]; selectedGames: Game[]; loading: boolean; canManage: boolean; setPending: (value: PendingAction | null) => void }) {
  if (loading) return <AdminNotice>{t.refreshing}</AdminNotice>;
  const targets = selectedGames.length ? selectedGames : visibleGames;
  return <div className={styles.maintenanceGrid}>
    <article className={`${styles.maintenanceCard} ${styles.warning}`}><div className={styles.cardHead}><div><h3>{t.maintenanceGames}</h3><p className={styles.meta}>{t.maintenanceDescription}</p></div><AdminBadge tone="warning">{targets.length}</AdminBadge></div>{!selectedGames.length && <p className={styles.helper}>{t.useVisibleGames}</p>}<div className={styles.bulkActions}><AdminButton tone="secondary" disabled={!canManage || targets.length === 0} onClick={() => setPending({ kind: 'bulk', games: targets, status: 'MAINTENANCE' })}>{t.maintainSelected}</AdminButton><AdminButton tone="success" disabled={!canManage || targets.length === 0} onClick={() => setPending({ kind: 'bulk', games: targets, status: 'ACTIVE' })}>{t.activateSelected}</AdminButton><AdminButton tone="danger" disabled={!canManage || targets.length === 0} onClick={() => setPending({ kind: 'bulk', games: targets, status: 'INACTIVE' })}>{t.disableSelected}</AdminButton></div></article>
    <article className={`${styles.maintenanceCard} ${styles.danger}`}><div className={styles.cardHead}><div><h3>{t.providerIssues}</h3><p className={styles.meta}>{t.providersDescription}</p></div><AdminBadge tone="warning">{providers.length}</AdminBadge></div><div className={styles.summaryGrid}>{providers.map((provider) => { const affected = games.filter((game) => game.providerId === provider.id).length; return <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><span>{t.affectedGames}: {affected}</span><div className={styles.actions}><AdminButton size="compact" tone="success" disabled={!canManage || provider.status === 'ACTIVE'} onClick={() => setPending({ kind: 'provider', provider, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="danger" disabled={!canManage || provider.status === 'MAINTENANCE'} onClick={() => setPending({ kind: 'provider', provider, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton></div></div>; })}</div></article>
  </div>;
}

function SimpleFilters({ t, query, setQuery, providers, providerFilter, setProviderFilter }: { t: Copy; query: string; setQuery: (value: string) => void; providers: Provider[]; providerFilter: string; setProviderFilter: (value: string) => void }) {
  return <div className={styles.filters}><input className={styles.control} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><select className={styles.control} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}><option value="ALL">{t.allProviders}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></div>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className={styles.summaryItem}><span>{label}</span><strong>{value.toLocaleString()}</strong></div>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function reportedGameStatus(game: Game): GameStatus | 'UNKNOWN' {
  const metadata = asRecord(game.metadata);
  const status = metadata.providerStatus ?? metadata.reportedStatus;
  return gameStatuses.includes(status as GameStatus) ? status as GameStatus : 'UNKNOWN';
}

function effectiveGameStatus(game: Game): GameStatus {
  if (game.status !== 'ACTIVE') return game.status;
  if (game.provider?.status && game.provider.status !== 'ACTIVE') return 'MAINTENANCE';
  const reported = reportedGameStatus(game);
  return reported === 'UNKNOWN' || reported === 'ACTIVE' ? 'ACTIVE' : reported;
}

function normalizeHealth(value: unknown): ProviderHealth {
  return value === 'ONLINE' || value === 'OFFLINE' || value === 'DEGRADED' ? value : 'UNKNOWN';
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone = normalized === 'ACTIVE' || normalized === 'ONLINE'
    ? 'success'
    : normalized === 'MAINTENANCE' || normalized === 'DEGRADED'
      ? 'warning'
      : normalized === 'INACTIVE' || normalized === 'REMOVED' || normalized === 'OFFLINE'
        ? 'danger'
        : 'neutral';
  return <AdminBadge tone={tone}>{normalized}</AdminBadge>;
}
