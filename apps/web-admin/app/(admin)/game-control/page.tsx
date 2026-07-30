'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminFilterBar,
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
type TabKey = 'overview' | 'home' | 'games' | 'providers' | 'competition' | 'maintenance';

type AvailabilityReason =
  | 'AVAILABLE'
  | 'GAME_DISABLED_BY_ADMIN'
  | 'GAME_UNAVAILABLE_AT_PROVIDER'
  | 'PROVIDER_DISABLED_BY_ADMIN'
  | 'PROVIDER_UNAVAILABLE';

type ProviderAvailability = {
  available: boolean;
  adminStatus: string;
  providerStatus: ProviderStatus;
  reason: AvailabilityReason;
};

type GameAvailability = {
  available: boolean;
  adminStatus: string;
  gameProviderStatus: GameStatus;
  providerAdminStatus: string;
  providerReportedStatus: ProviderStatus;
  effectiveStatus: GameStatus;
  reason: AvailabilityReason;
};

type Provider = {
  id: string;
  name: string;
  code: string;
  status: ProviderStatus;
  walletMode?: string;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  availability?: ProviderAvailability;
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
  metadata?: Record<string, unknown> | null;
  provider?: Provider;
  availability?: GameAvailability;
};

type PendingChange =
  | { type: 'game'; game: Game; status: GameStatus }
  | { type: 'provider'; provider: Provider; status: ProviderStatus }
  | { type: 'bulk'; games: Game[]; status: GameStatus };

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  refresh: string;
  loading: string;
  retry: string;
  tabs: Record<TabKey, string>;
  totalGames: string;
  availableGames: string;
  adminActive: string;
  providerBlocked: string;
  featuredGames: string;
  providersOnline: string;
  systemOverview: string;
  systemOverviewDescription: string;
  attention: string;
  noAttention: string;
  unavailableGames: string;
  providerIssues: string;
  homeTitle: string;
  homeDescription: string;
  gameCatalog: string;
  gameCatalogDescription: string;
  providerTitle: string;
  providerDescription: string;
  competitionTitle: string;
  competitionDescription: string;
  maintenanceTitle: string;
  maintenanceDescription: string;
  search: string;
  allProviders: string;
  allStatuses: string;
  allCategories: string;
  selected: string;
  selectVisible: string;
  clearSelection: string;
  game: string;
  provider: string;
  category: string;
  adminStatus: string;
  providerStatus: string;
  effectiveStatus: string;
  flags: string;
  actions: string;
  featured: string;
  popular: string;
  newGame: string;
  enabled: string;
  disabled: string;
  healthCheck: string;
  syncGames: string;
  settings: string;
  featureSettings: string;
  activate: string;
  disable: string;
  maintenance: string;
  remove: string;
  makeFeatured: string;
  removeFeatured: string;
  makePopular: string;
  removePopular: string;
  markNew: string;
  removeNew: string;
  bulkMaintenance: string;
  bulkActivate: string;
  bulkDisable: string;
  visibleGames: string;
  noGames: string;
  noProviders: string;
  saved: string;
  failed: string;
  loaded: string;
  confirmTitle: string;
  confirmDescription: string;
  confirm: string;
  cancel: string;
  providerControls: string;
  providerControlsDescription: string;
  campaignVisibility: string;
  campaignVisibilityDescription: string;
  maintenanceGames: string;
  maintenanceProviders: string;
  affectedGames: string;
  gameCount: string;
};

const copy: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'แพลตฟอร์มเกม',
    title: 'ศูนย์ควบคุมเกม',
    description: 'ควบคุมเกมหน้าแรก รายการเกม ค่ายเกม สถานะจาก API และการปิดปรับปรุงจากจุดเดียว',
    refresh: 'อัปเดตข้อมูล', loading: 'กำลังโหลด...', retry: 'ลองใหม่',
    tabs: { overview: 'ภาพรวม', home: 'เกมหน้าแรก', games: 'เกมทั้งหมด', providers: 'ค่ายเกม / API', competition: 'Tournament / Leaderboard', maintenance: 'ปิดระบบ / Maintenance' },
    totalGames: 'เกมทั้งหมด', availableGames: 'พร้อมให้บริการ', adminActive: 'Admin เปิดใช้', providerBlocked: 'Provider ปิดกั้น', featuredGames: 'เกมหน้าแรก', providersOnline: 'ค่ายพร้อมใช้',
    systemOverview: 'สถานะระบบเกม', systemOverviewDescription: 'สถานะที่มีผลจริงคำนวณจากการตั้งค่า Admin และรายงานจาก Provider ร่วมกัน', attention: 'ต้องตรวจสอบ', noAttention: 'เกมและค่ายที่เปิดใช้งานพร้อมให้บริการตามปกติ', unavailableGames: 'เกมที่เปิดโดย Admin แต่ Provider ไม่พร้อม', providerIssues: 'ค่ายที่รายงานปัญหา',
    homeTitle: 'จัดเกมหน้าแรก', homeDescription: 'กำหนด Featured, Popular และ New ด้วยข้อมูลจริงจากคลังเกม',
    gameCatalog: 'ควบคุมเกมทั้งหมด', gameCatalogDescription: 'ค้นหา กรอง เปิด ปิด และปิดปรับปรุงรายเกมหรือหลายเกมพร้อมกัน',
    providerTitle: 'ค่ายเกมและ API', providerDescription: 'ตรวจสุขภาพ ซิงก์รายชื่อเกม และควบคุมสถานะ Admin โดยไม่ให้ Provider เปิดกลับเอง',
    competitionTitle: 'Tournament และ Leaderboard', competitionDescription: 'จัดลำดับเกมเด่น เกมยอดนิยม และเกมใหม่ที่ใช้กับพื้นที่แข่งขันหรืออันดับ',
    maintenanceTitle: 'ศูนย์ปิดปรับปรุง', maintenanceDescription: 'ปิดเกมหรือค่ายแบบควบคุมได้ พร้อมเห็นจำนวนเกมที่ได้รับผลกระทบก่อนดำเนินการ',
    search: 'ค้นหาชื่อเกม รหัสเกม หรือค่าย', allProviders: 'ทุกค่าย', allStatuses: 'ทุกสถานะ', allCategories: 'ทุกหมวด', selected: 'เลือกแล้ว', selectVisible: 'เลือกที่แสดง', clearSelection: 'ล้างที่เลือก',
    game: 'เกม', provider: 'ค่าย', category: 'หมวด', adminStatus: 'สถานะ Admin', providerStatus: 'สถานะ Provider', effectiveStatus: 'สถานะใช้งานจริง', flags: 'การแสดงผล', actions: 'คำสั่ง',
    featured: 'Featured', popular: 'Popular', newGame: 'New', enabled: 'เปิด', disabled: 'ปิด', healthCheck: 'ตรวจสุขภาพ', syncGames: 'ซิงก์เกม', settings: 'ตั้งค่าค่าย', featureSettings: 'ตั้งค่าฟีเจอร์', activate: 'เปิดใช้งาน', disable: 'ปิดใช้งาน', maintenance: 'ปิดปรับปรุง', remove: 'นำออก',
    makeFeatured: 'ขึ้นหน้าแรก', removeFeatured: 'เอาออกจากหน้าแรก', makePopular: 'ทำเป็นยอดนิยม', removePopular: 'เลิกเป็นยอดนิยม', markNew: 'ทำเป็นเกมใหม่', removeNew: 'เลิกเป็นเกมใหม่',
    bulkMaintenance: 'ปิดปรับปรุงที่เลือก', bulkActivate: 'เปิดเกมที่เลือก', bulkDisable: 'ปิดเกมที่เลือก', visibleGames: 'เกมที่แสดง', noGames: 'ไม่พบเกมตามตัวกรอง', noProviders: 'ไม่พบข้อมูลค่ายเกม',
    saved: 'บันทึกการเปลี่ยนแปลงแล้ว', failed: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่', loaded: 'อัปเดตข้อมูลล่าสุดแล้ว', confirmTitle: 'ยืนยันการเปลี่ยนสถานะ', confirmDescription: 'ระบบจะใช้สถานะนี้ทันทีและ Member API จะตรวจซ้ำก่อนเปิดเกม', confirm: 'ยืนยัน', cancel: 'ยกเลิก',
    providerControls: 'ควบคุมค่ายเกม', providerControlsDescription: 'สถานะ Admin มีสิทธิ์สูงสุด ส่วนสถานะ Provider ใช้ปิดกั้นเมื่อค่ายไม่พร้อม', campaignVisibility: 'การมองเห็นในแคมเปญและอันดับ', campaignVisibilityDescription: 'ป้ายเหล่านี้ใช้จัดกลุ่มเกมในหน้า Member และพื้นที่แนะนำ', maintenanceGames: 'ปิดปรับปรุงเกม', maintenanceProviders: 'ปิดปรับปรุงค่าย', affectedGames: 'เกมที่ได้รับผลกระทบ', gameCount: 'เกม',
  },
  en: {
    eyebrow: 'Game platform',
    title: 'Game control center',
    description: 'Control home games, catalog, providers, API health, and maintenance from one workspace',
    refresh: 'Refresh data', loading: 'Loading...', retry: 'Retry',
    tabs: { overview: 'Overview', home: 'Home games', games: 'All games', providers: 'Providers / API', competition: 'Tournament / Leaderboard', maintenance: 'Shutdown / Maintenance' },
    totalGames: 'Total games', availableGames: 'Available', adminActive: 'Admin enabled', providerBlocked: 'Provider blocked', featuredGames: 'Home games', providersOnline: 'Providers available',
    systemOverview: 'Game system status', systemOverviewDescription: 'Effective availability combines Admin settings with Provider reports', attention: 'Needs review', noAttention: 'Enabled games and providers are operating normally', unavailableGames: 'Admin-enabled games blocked by Provider', providerIssues: 'Providers reporting issues',
    homeTitle: 'Manage home games', homeDescription: 'Set Featured, Popular, and New using live catalog data',
    gameCatalog: 'Control all games', gameCatalogDescription: 'Search, filter, enable, disable, or maintain individual and selected games',
    providerTitle: 'Providers and API', providerDescription: 'Run health checks, sync games, and retain Admin control without Provider auto-enabling',
    competitionTitle: 'Tournament and leaderboard', competitionDescription: 'Arrange featured, popular, and new games used by competition and ranking surfaces',
    maintenanceTitle: 'Maintenance center', maintenanceDescription: 'Disable games or providers with affected-game counts shown before changes',
    search: 'Search game, code, or provider', allProviders: 'All providers', allStatuses: 'All statuses', allCategories: 'All categories', selected: 'selected', selectVisible: 'Select visible', clearSelection: 'Clear selection',
    game: 'Game', provider: 'Provider', category: 'Category', adminStatus: 'Admin status', providerStatus: 'Provider status', effectiveStatus: 'Effective status', flags: 'Display flags', actions: 'Actions',
    featured: 'Featured', popular: 'Popular', newGame: 'New', enabled: 'Enabled', disabled: 'Disabled', healthCheck: 'Health check', syncGames: 'Sync games', settings: 'Provider settings', featureSettings: 'Feature settings', activate: 'Activate', disable: 'Disable', maintenance: 'Maintenance', remove: 'Remove',
    makeFeatured: 'Add to home', removeFeatured: 'Remove from home', makePopular: 'Mark popular', removePopular: 'Unmark popular', markNew: 'Mark new', removeNew: 'Unmark new',
    bulkMaintenance: 'Maintain selected', bulkActivate: 'Activate selected', bulkDisable: 'Disable selected', visibleGames: 'visible games', noGames: 'No games match the filters', noProviders: 'No provider data',
    saved: 'Changes saved', failed: 'Action failed. Please try again', loaded: 'Latest data loaded', confirmTitle: 'Confirm status change', confirmDescription: 'The status takes effect immediately and the Member API rechecks it before launch', confirm: 'Confirm', cancel: 'Cancel',
    providerControls: 'Provider controls', providerControlsDescription: 'Admin status has final authority while Provider reports can block unavailable services', campaignVisibility: 'Campaign and ranking visibility', campaignVisibilityDescription: 'These flags organize games across Member recommendations and ranking surfaces', maintenanceGames: 'Game maintenance', maintenanceProviders: 'Provider maintenance', affectedGames: 'Affected games', gameCount: 'games',
  },
};

const gameStatuses: GameStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REMOVED'];
const providerStatuses: ProviderStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'];

export default function GameControlPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const [tab, setTab] = useState<TabKey>('overview');
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GameStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingChange | null>(null);

  useEffect(() => { void loadAll(); }, []);

  const categories = useMemo(() => [...new Set(games.map((item) => item.category).filter(Boolean))].sort(), [games]);
  const visibleGames = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase(locale === 'th' ? 'th' : 'en');
    return games.filter((item) => {
      const text = `${item.name} ${item.providerGameCode} ${item.provider?.name ?? ''} ${item.provider?.code ?? ''}`.toLocaleLowerCase(locale === 'th' ? 'th' : 'en');
      return (!keyword || text.includes(keyword))
        && (providerFilter === 'ALL' || item.providerId === providerFilter)
        && (statusFilter === 'ALL' || item.status === statusFilter)
        && (categoryFilter === 'ALL' || item.category === categoryFilter);
    });
  }, [games, query, providerFilter, statusFilter, categoryFilter, locale]);
  const selectedGames = useMemo(() => games.filter((item) => selectedIds.includes(item.id)), [games, selectedIds]);
  const providerIssueItems = useMemo(() => providers.filter((item) => item.status === 'ACTIVE' && item.availability && !item.availability.available), [providers]);
  const blockedGames = useMemo(() => games.filter((item) => item.status === 'ACTIVE' && item.availability && !item.availability.available), [games]);
  const metrics = useMemo(() => ({
    total: games.length,
    available: games.filter((item) => item.availability?.available ?? item.status === 'ACTIVE').length,
    adminActive: games.filter((item) => item.status === 'ACTIVE').length,
    providerBlocked: blockedGames.length,
    featured: games.filter((item) => item.isFeatured).length,
    providersOnline: providers.filter((item) => item.availability?.available ?? item.status === 'ACTIVE').length,
  }), [games, providers, blockedGames]);
  const pageBusy = loading || Boolean(busyKey);

  async function loadAll() {
    setLoading(true);
    setError(false);
    setMessage('');
    try {
      const [gamesResponse, providersResponse] = await Promise.all([
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/game-providers?take=100'),
      ]);
      const [gamesData, providersData] = await Promise.all([
        gamesResponse.json().catch(() => null),
        providersResponse.json().catch(() => null),
      ]);
      if (!gamesResponse.ok || !Array.isArray(gamesData?.items)) throw new Error('games');
      if (!providersResponse.ok || !Array.isArray(providersData?.items)) throw new Error('providers');
      const nextGames = gamesData.items as Game[];
      setGames(nextGames);
      setProviders(providersData.items as Provider[]);
      setSelectedIds((current) => current.filter((id) => nextGames.some((item) => item.id === id)));
      setMessage(t.loaded);
    } catch {
      setError(true);
      setMessage(t.failed);
    } finally {
      setLoading(false);
    }
  }

  async function patchGame(game: Game, patch: Partial<Pick<Game, 'status' | 'isFeatured' | 'isPopular' | 'isNew'>>) {
    if (busyKey) return false;
    setBusyKey(`game:${game.id}`);
    setError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/games/${game.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('game');
      setGames((current) => current.map((item) => item.id === game.id ? { ...item, ...payload } : item));
      setMessage(t.saved);
      return true;
    } catch {
      setError(true);
      setMessage(t.failed);
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function patchProvider(provider: Provider, status: ProviderStatus) {
    if (busyKey) return false;
    setBusyKey(`provider:${provider.id}`);
    setError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('provider');
      setMessage(t.saved);
      await loadAll();
      return true;
    } catch {
      setError(true);
      setMessage(t.failed);
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function providerAction(provider: Provider, action: 'health-check' | 'sync-games') {
    if (busyKey) return;
    setBusyKey(`${action}:${provider.id}`);
    setError(false);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(action);
      setMessage(t.saved);
      await loadAll();
    } catch {
      setError(true);
      setMessage(t.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function patchMany(targets: Game[], status: GameStatus) {
    if (busyKey || targets.length === 0) return;
    setBusyKey('bulk');
    setError(false);
    setMessage('');
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
    setMessage(failed ? `${t.failed} (${failed}/${targets.length})` : t.saved);
    setError(failed > 0);
    await loadAll();
  }

  async function confirmPending() {
    const action = pending;
    if (!action || busyKey) return;
    if (action.type === 'game') {
      const success = await patchGame(action.game, { status: action.status });
      if (success) setPending(null);
      return;
    }
    if (action.type === 'provider') {
      const success = await patchProvider(action.provider, action.status);
      if (success) setPending(null);
      return;
    }
    await patchMany(action.games, action.status);
  }

  function toggleSelected(id: string) {
    if (pageBusy) return;
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleVisible() {
    if (pageBusy) return;
    setSelectedIds((current) => visibleGames.every((item) => current.includes(item.id))
      ? current.filter((id) => !visibleGames.some((item) => item.id === id))
      : [...new Set([...current, ...visibleGames.map((item) => item.id)])]);
  }

  const pendingStatus = pending?.status;
  const pendingCount = pending?.type === 'bulk' ? pending.games.length : 1;
  const pendingTone = pendingStatus === 'ACTIVE' ? 'success' : pendingStatus === 'INACTIVE' || pendingStatus === 'REMOVED' ? 'danger' : 'primary';

  return <AdminPage
    eyebrow={t.eyebrow}
    title={t.title}
    description={t.description}
    actions={<AdminButton onClick={() => void loadAll()} disabled={pageBusy}>{loading ? t.loading : t.refresh}</AdminButton>}
  >
    <div className={styles.page}>
      <AdminMetricGrid>
        <AdminMetric title={t.totalGames} value={String(metrics.total)} />
        <AdminMetric title={t.availableGames} value={String(metrics.available)} tone="success" />
        <AdminMetric title={t.providerBlocked} value={String(metrics.providerBlocked)} tone={metrics.providerBlocked ? 'warning' : 'success'} />
        <AdminMetric title={t.featuredGames} value={String(metrics.featured)} tone="brand" />
        <AdminMetric title={t.providersOnline} value={`${metrics.providersOnline}/${providers.length}`} tone={metrics.providersOnline === providers.length ? 'success' : 'warning'} />
      </AdminMetricGrid>

      {message && <AdminNotice tone={error ? 'danger' : 'success'}>{message}{error ? <AdminButton size="compact" tone="ghost" onClick={() => void loadAll()}>{t.retry}</AdminButton> : null}</AdminNotice>}

      <nav className={styles.tabs} aria-label={t.title}>
        {(Object.keys(t.tabs) as TabKey[]).map((key) => <button key={key} type="button" className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>{t.tabs[key]}</button>)}
      </nav>

      {tab === 'overview' && <OverviewPanel t={t} games={games} providers={providers} blockedGames={blockedGames} providerIssues={providerIssueItems} loading={loading} />}
      {tab === 'home' && <FlagPanel t={t} games={visibleGames} loading={loading} busyKey={busyKey} onPatch={patchGame} query={query} setQuery={setQuery} providers={providers} providerFilter={providerFilter} setProviderFilter={setProviderFilter} />}
      {tab === 'games' && <GameTablePanel t={t} games={visibleGames} providers={providers} categories={categories} loading={loading} busyKey={busyKey} query={query} setQuery={setQuery} providerFilter={providerFilter} setProviderFilter={setProviderFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} selectedIds={selectedIds} toggleSelected={toggleSelected} toggleVisible={toggleVisible} setSelectedIds={setSelectedIds} setPending={setPending} />}
      {tab === 'providers' && <ProviderPanel t={t} providers={providers} games={games} loading={loading} busyKey={busyKey} onAction={providerAction} setPending={setPending} />}
      {tab === 'competition' && <CompetitionPanel t={t} games={visibleGames} providers={providers} loading={loading} busyKey={busyKey} query={query} setQuery={setQuery} providerFilter={providerFilter} setProviderFilter={setProviderFilter} onPatch={patchGame} />}
      {tab === 'maintenance' && <MaintenancePanel t={t} games={games} providers={providers} selectedGames={selectedGames} visibleGames={visibleGames} loading={loading} setPending={setPending} />}
    </div>

    <AdminConfirmDialog
      open={Boolean(pending)}
      title={t.confirmTitle}
      description={`${t.confirmDescription} (${pendingCount} ${t.gameCount})`}
      confirmLabel={t.confirm}
      cancelLabel={t.cancel}
      tone={pendingTone}
      busy={Boolean(busyKey)}
      details={pendingStatus ? <StatusBadges locale={locale} adminStatus={pendingStatus} providerStatus={pendingStatus} effectiveStatus={pendingStatus as GameStatus} /> : null}
      onConfirm={() => void confirmPending()}
      onCancel={() => { if (!busyKey) setPending(null); }}
    />
  </AdminPage>;
}

function OverviewPanel({ t, games, providers, blockedGames, providerIssues, loading }: { t: Copy; games: Game[]; providers: Provider[]; blockedGames: Game[]; providerIssues: Provider[]; loading: boolean }) {
  if (loading) return <AdminNotice>{t.loading}</AdminNotice>;
  const maintenanceGames = games.filter((item) => item.status === 'MAINTENANCE').length;
  const inactiveGames = games.filter((item) => item.status === 'INACTIVE' || item.status === 'REMOVED').length;
  return <div className={styles.panelGrid}>
    <AdminCard title={t.systemOverview} description={t.systemOverviewDescription} tone={blockedGames.length || providerIssues.length ? 'warning' : 'success'}>
      <div className={styles.summaryList}>
        <div className={styles.summaryItem}><span>{t.adminActive}</span><strong>{games.filter((item) => item.status === 'ACTIVE').length}</strong></div>
        <div className={styles.summaryItem}><span>{t.maintenance}</span><strong>{maintenanceGames}</strong></div>
        <div className={styles.summaryItem}><span>{t.disabled}</span><strong>{inactiveGames}</strong></div>
        <div className={styles.summaryItem}><span>{t.providerBlocked}</span><strong>{blockedGames.length}</strong></div>
      </div>
      {!blockedGames.length && !providerIssues.length ? <AdminNotice tone="success">{t.noAttention}</AdminNotice> : null}
    </AdminCard>

    <AdminCard title={t.providerIssues} description={t.providerDescription} tone={providerIssues.length ? 'warning' : 'success'}>
      {providerIssues.length ? <div className={styles.summaryList}>{providerIssues.map((provider) => <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><StatusBadges adminStatus={provider.status} providerStatus={provider.availability?.providerStatus ?? provider.status} effectiveStatus={provider.availability?.available ? 'ACTIVE' : 'MAINTENANCE'} /></div>)}</div> : <AdminEmpty>{t.noProviders}</AdminEmpty>}
    </AdminCard>

    <AdminCard title={t.unavailableGames} description={t.systemOverviewDescription} tone={blockedGames.length ? 'warning' : 'success'}>
      {blockedGames.length ? <div className={styles.summaryList}>{blockedGames.slice(0, 12).map((game) => <div key={game.id} className={styles.summaryItem}><strong>{game.name}</strong><span>{game.provider?.name ?? game.providerId}</span><StatusBadges adminStatus={game.status} providerStatus={game.availability?.gameProviderStatus ?? game.status} effectiveStatus={game.availability?.effectiveStatus ?? game.status} /></div>)}</div> : <AdminEmpty>{t.noAttention}</AdminEmpty>}
    </AdminCard>

    <AdminCard title={t.providerControls} description={t.providerControlsDescription}>
      <div className={styles.summaryList}>
        {providers.slice(0, 12).map((provider) => <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><span>{provider.code} · {provider._count?.games ?? 0} {t.gameCount}</span><StatusBadges adminStatus={provider.status} providerStatus={provider.availability?.providerStatus ?? provider.status} effectiveStatus={provider.availability?.available ? 'ACTIVE' : 'MAINTENANCE'} /></div>)}
      </div>
    </AdminCard>
  </div>;
}

function FlagPanel({ t, games, providers, loading, busyKey, onPatch, query, setQuery, providerFilter, setProviderFilter }: { t: Copy; games: Game[]; providers: Provider[]; loading: boolean; busyKey: string; onPatch: (game: Game, patch: Partial<Pick<Game, 'isFeatured' | 'isPopular' | 'isNew'>>) => Promise<boolean>; query: string; setQuery: (value: string) => void; providerFilter: string; setProviderFilter: (value: string) => void }) {
  return <AdminCard title={t.homeTitle} description={t.homeDescription}>
    <GameFilters t={t} query={query} setQuery={setQuery} providers={providers} providerFilter={providerFilter} setProviderFilter={setProviderFilter} />
    {loading ? <AdminNotice>{t.loading}</AdminNotice> : games.length ? <div className={styles.flagGrid}>{games.map((game) => <GameFlagCard key={game.id} t={t} game={game} busy={Boolean(busyKey)} onPatch={onPatch} />)}</div> : <AdminEmpty>{t.noGames}</AdminEmpty>}
  </AdminCard>;
}

function CompetitionPanel({ t, games, providers, loading, busyKey, onPatch, query, setQuery, providerFilter, setProviderFilter }: { t: Copy; games: Game[]; providers: Provider[]; loading: boolean; busyKey: string; onPatch: (game: Game, patch: Partial<Pick<Game, 'isFeatured' | 'isPopular' | 'isNew'>>) => Promise<boolean>; query: string; setQuery: (value: string) => void; providerFilter: string; setProviderFilter: (value: string) => void }) {
  const ranked = [...games].sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  return <div className={styles.panelGrid}>
    <AdminCard title={t.competitionTitle} description={t.competitionDescription} action={<AdminLinkButton href="/settings/features" tone="ghost" size="compact">{t.featureSettings}</AdminLinkButton>}>
      <GameFilters t={t} query={query} setQuery={setQuery} providers={providers} providerFilter={providerFilter} setProviderFilter={setProviderFilter} />
      {loading ? <AdminNotice>{t.loading}</AdminNotice> : ranked.length ? <div className={styles.flagGrid}>{ranked.map((game) => <GameFlagCard key={game.id} t={t} game={game} busy={Boolean(busyKey)} onPatch={onPatch} />)}</div> : <AdminEmpty>{t.noGames}</AdminEmpty>}
    </AdminCard>
  </div>;
}

function GameFlagCard({ t, game, busy, onPatch }: { t: Copy; game: Game; busy: boolean; onPatch: (game: Game, patch: Partial<Pick<Game, 'isFeatured' | 'isPopular' | 'isNew'>>) => Promise<boolean> }) {
  return <article className={styles.flagCard}>
    <div className={styles.gameHead}><div><h3>{game.name}</h3><p className={styles.cardDescription}>{game.provider?.name ?? game.providerId} · {game.category}</p></div><AdminBadge tone={game.availability?.available ? 'success' : 'warning'}>{game.availability?.available ? 'ONLINE' : game.availability?.effectiveStatus ?? game.status}</AdminBadge></div>
    <div className={styles.statusLine}>{game.isFeatured && <AdminBadge tone="success">Featured</AdminBadge>}{game.isPopular && <AdminBadge tone="warning">Popular</AdminBadge>}{game.isNew && <AdminBadge>New</AdminBadge>}{!game.isFeatured && !game.isPopular && !game.isNew && <span className={styles.helper}>-</span>}</div>
    <div className={styles.flagActions}>
      <AdminButton size="compact" tone={game.isFeatured ? 'success' : 'ghost'} disabled={busy} onClick={() => void onPatch(game, { isFeatured: !game.isFeatured })}>{game.isFeatured ? t.removeFeatured : t.makeFeatured}</AdminButton>
      <AdminButton size="compact" tone={game.isPopular ? 'success' : 'ghost'} disabled={busy} onClick={() => void onPatch(game, { isPopular: !game.isPopular })}>{game.isPopular ? t.removePopular : t.makePopular}</AdminButton>
      <AdminButton size="compact" tone={game.isNew ? 'success' : 'ghost'} disabled={busy} onClick={() => void onPatch(game, { isNew: !game.isNew })}>{game.isNew ? t.removeNew : t.markNew}</AdminButton>
    </div>
  </article>;
}

function GameTablePanel({ t, games, providers, categories, loading, busyKey, query, setQuery, providerFilter, setProviderFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, selectedIds, toggleSelected, toggleVisible, setSelectedIds, setPending }: { t: Copy; games: Game[]; providers: Provider[]; categories: string[]; loading: boolean; busyKey: string; query: string; setQuery: (value: string) => void; providerFilter: string; setProviderFilter: (value: string) => void; statusFilter: 'ALL' | GameStatus; setStatusFilter: (value: 'ALL' | GameStatus) => void; categoryFilter: string; setCategoryFilter: (value: string) => void; selectedIds: string[]; toggleSelected: (id: string) => void; toggleVisible: () => void; setSelectedIds: (value: string[]) => void; setPending: (value: PendingChange | null) => void }) {
  const selected = games.filter((item) => selectedIds.includes(item.id));
  return <AdminCard title={t.gameCatalog} description={t.gameCatalogDescription}>
    <AdminFilterBar resultText={`${games.length} ${t.visibleGames} · ${selectedIds.length} ${t.selected}`}>
      <input className={styles.filterControl} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
      <select className={styles.filterControl} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}><option value="ALL">{t.allProviders}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select>
      <select className={styles.filterControl} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | GameStatus)}><option value="ALL">{t.allStatuses}</option>{gameStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
      <select className={styles.filterControl} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="ALL">{t.allCategories}</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
    </AdminFilterBar>
    <AdminToolbar>
      <AdminButton size="compact" tone="ghost" disabled={loading || Boolean(busyKey) || games.length === 0} onClick={toggleVisible}>{t.selectVisible}</AdminButton>
      <AdminButton size="compact" tone="ghost" disabled={loading || Boolean(busyKey) || selectedIds.length === 0} onClick={() => setSelectedIds([])}>{t.clearSelection}</AdminButton>
      <AdminButton size="compact" tone="success" disabled={selected.length === 0 || Boolean(busyKey)} onClick={() => setPending({ type: 'bulk', games: selected, status: 'ACTIVE' })}>{t.bulkActivate}</AdminButton>
      <AdminButton size="compact" tone="secondary" disabled={selected.length === 0 || Boolean(busyKey)} onClick={() => setPending({ type: 'bulk', games: selected, status: 'MAINTENANCE' })}>{t.bulkMaintenance}</AdminButton>
      <AdminButton size="compact" tone="danger" disabled={selected.length === 0 || Boolean(busyKey)} onClick={() => setPending({ type: 'bulk', games: selected, status: 'INACTIVE' })}>{t.bulkDisable}</AdminButton>
    </AdminToolbar>
    {loading ? <AdminNotice>{t.loading}</AdminNotice> : games.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.selectCell}><input className={styles.checkbox} type="checkbox" checked={games.length > 0 && games.every((item) => selectedIds.includes(item.id))} onChange={toggleVisible} /></th><th>{t.game}</th><th>{t.provider}</th><th>{t.category}</th><th>{t.adminStatus}</th><th>{t.providerStatus}</th><th>{t.effectiveStatus}</th><th>{t.flags}</th><th>{t.actions}</th></tr></thead><tbody>{games.map((game) => <tr key={game.id}><td className={styles.selectCell}><input className={styles.checkbox} type="checkbox" checked={selectedIds.includes(game.id)} onChange={() => toggleSelected(game.id)} /></td><td><div className={styles.nameCell}><strong>{game.name}</strong><span className={styles.code}>{game.providerGameCode}</span></div></td><td>{game.provider?.name ?? game.providerId}</td><td>{game.category}</td><td><StatusBadge status={game.status} /></td><td><StatusBadge status={game.availability?.gameProviderStatus ?? game.status} /></td><td><StatusBadge status={game.availability?.effectiveStatus ?? game.status} /></td><td><div className={styles.statusLine}>{game.isFeatured && <AdminBadge tone="success">F</AdminBadge>}{game.isPopular && <AdminBadge tone="warning">P</AdminBadge>}{game.isNew && <AdminBadge>N</AdminBadge>}</div></td><td><div className={styles.actions}><AdminButton size="compact" tone="success" disabled={Boolean(busyKey) || game.status === 'ACTIVE'} onClick={() => setPending({ type: 'game', game, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="secondary" disabled={Boolean(busyKey) || game.status === 'MAINTENANCE'} onClick={() => setPending({ type: 'game', game, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton><AdminButton size="compact" tone="danger" disabled={Boolean(busyKey) || game.status === 'INACTIVE'} onClick={() => setPending({ type: 'game', game, status: 'INACTIVE' })}>{t.disable}</AdminButton></div></td></tr>)}</tbody></table></div> : <AdminEmpty>{t.noGames}</AdminEmpty>}
  </AdminCard>;
}

function ProviderPanel({ t, providers, games, loading, busyKey, onAction, setPending }: { t: Copy; providers: Provider[]; games: Game[]; loading: boolean; busyKey: string; onAction: (provider: Provider, action: 'health-check' | 'sync-games') => Promise<void>; setPending: (value: PendingChange | null) => void }) {
  if (loading) return <AdminNotice>{t.loading}</AdminNotice>;
  return <AdminCard title={t.providerTitle} description={t.providerDescription} action={<AdminLinkButton href="/simple-game-settings" tone="ghost" size="compact">{t.settings}</AdminLinkButton>}>
    {providers.length ? <div className={styles.providerGrid}>{providers.map((provider) => {
      const affected = games.filter((game) => game.providerId === provider.id).length;
      return <article key={provider.id} className={styles.providerCard}><div className={styles.providerHead}><div><h3>{provider.name}</h3><p className={styles.cardDescription}>{provider.code} · {affected} {t.gameCount}</p></div><AdminBadge tone={provider.availability?.available ? 'success' : 'warning'}>{provider.availability?.available ? 'ONLINE' : provider.availability?.providerStatus ?? provider.status}</AdminBadge></div><StatusBadges adminStatus={provider.status} providerStatus={provider.availability?.providerStatus ?? provider.status} effectiveStatus={provider.availability?.available ? 'ACTIVE' : 'MAINTENANCE'} /><p className={styles.providerMeta}>{provider.walletMode ?? '-'} · {provider.currency ?? '-'} · API {provider._count?.endpoints ?? 0} · Credentials {provider._count?.credentials ?? 0}</p><div className={styles.actions}><AdminButton size="compact" tone="ghost" disabled={Boolean(busyKey)} onClick={() => void onAction(provider, 'health-check')}>{t.healthCheck}</AdminButton><AdminButton size="compact" tone="secondary" disabled={Boolean(busyKey)} onClick={() => void onAction(provider, 'sync-games')}>{t.syncGames}</AdminButton><AdminButton size="compact" tone="success" disabled={Boolean(busyKey) || provider.status === 'ACTIVE'} onClick={() => setPending({ type: 'provider', provider, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="danger" disabled={Boolean(busyKey) || provider.status === 'MAINTENANCE'} onClick={() => setPending({ type: 'provider', provider, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton></div></article>;
    })}</div> : <AdminEmpty>{t.noProviders}</AdminEmpty>}
  </AdminCard>;
}

function MaintenancePanel({ t, games, providers, selectedGames, visibleGames, loading, setPending }: { t: Copy; games: Game[]; providers: Provider[]; selectedGames: Game[]; visibleGames: Game[]; loading: boolean; setPending: (value: PendingChange | null) => void }) {
  if (loading) return <AdminNotice>{t.loading}</AdminNotice>;
  return <div className={styles.maintenanceGrid}>
    <article className={`${styles.maintenanceCard} ${styles.warningZone}`}><div className={styles.cardHead}><div><h3>{t.maintenanceGames}</h3><p className={styles.cardDescription}>{t.maintenanceDescription}</p></div><AdminBadge tone="warning">{selectedGames.length || visibleGames.length}</AdminBadge></div><p className={styles.helper}>{t.selected}: {selectedGames.length} · {t.visibleGames}: {visibleGames.length}</p><div className={styles.bulkActions}><AdminButton tone="secondary" disabled={(selectedGames.length || visibleGames.length) === 0} onClick={() => setPending({ type: 'bulk', games: selectedGames.length ? selectedGames : visibleGames, status: 'MAINTENANCE' })}>{t.bulkMaintenance}</AdminButton><AdminButton tone="success" disabled={(selectedGames.length || visibleGames.length) === 0} onClick={() => setPending({ type: 'bulk', games: selectedGames.length ? selectedGames : visibleGames, status: 'ACTIVE' })}>{t.bulkActivate}</AdminButton><AdminButton tone="danger" disabled={(selectedGames.length || visibleGames.length) === 0} onClick={() => setPending({ type: 'bulk', games: selectedGames.length ? selectedGames : visibleGames, status: 'INACTIVE' })}>{t.bulkDisable}</AdminButton></div></article>
    <article className={`${styles.maintenanceCard} ${styles.dangerZone}`}><div className={styles.cardHead}><div><h3>{t.maintenanceProviders}</h3><p className={styles.cardDescription}>{t.providerControlsDescription}</p></div><AdminBadge tone="warning">{providers.length}</AdminBadge></div><div className={styles.providerGrid}>{providers.map((provider) => { const affected = games.filter((game) => game.providerId === provider.id).length; return <div key={provider.id} className={styles.summaryItem}><strong>{provider.name}</strong><span>{t.affectedGames}: {affected}</span><div className={styles.actions}><AdminButton size="compact" tone="success" disabled={provider.status === 'ACTIVE'} onClick={() => setPending({ type: 'provider', provider, status: 'ACTIVE' })}>{t.activate}</AdminButton><AdminButton size="compact" tone="danger" disabled={provider.status === 'MAINTENANCE'} onClick={() => setPending({ type: 'provider', provider, status: 'MAINTENANCE' })}>{t.maintenance}</AdminButton></div></div>; })}</div></article>
  </div>;
}

function GameFilters({ t, query, setQuery, providers, providerFilter, setProviderFilter }: { t: Copy; query: string; setQuery: (value: string) => void; providers: Provider[]; providerFilter: string; setProviderFilter: (value: string) => void }) {
  return <AdminFilterBar><input className={styles.filterControl} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><select className={styles.filterControl} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}><option value="ALL">{t.allProviders}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></AdminFilterBar>;
}

function StatusBadges({ adminStatus, providerStatus, effectiveStatus }: { locale?: AdminLocale; adminStatus: string; providerStatus: string; effectiveStatus: string }) {
  return <div className={styles.statusLine}><StatusBadge status={adminStatus} /><span className={styles.helper}>+</span><StatusBadge status={providerStatus} /><span className={styles.helper}>=</span><StatusBadge status={effectiveStatus} /></div>;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone = normalized === 'ACTIVE' || normalized === 'ONLINE' ? 'success' : normalized === 'MAINTENANCE' || normalized === 'DEGRADED' ? 'warning' : normalized === 'REMOVED' ? 'danger' : 'neutral';
  return <AdminBadge tone={tone}>{normalized}</AdminBadge>;
}
