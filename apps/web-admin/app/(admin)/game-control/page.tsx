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
  AdminGrid,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
  AdminToolbar,
} from '../_components/admin-ui';

type GameStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
type ProviderReportedStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
type TabId = 'overview' | 'homepage' | 'games' | 'providers' | 'tournament' | 'maintenance';
type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

type Provider = {
  id: string;
  name: string;
  code: string;
  status: ProviderStatus;
  walletMode?: string;
  updatedAt: string;
  _count?: { games?: number; endpoints?: number; credentials?: number; sessions?: number; webhookLogs?: number };
};

type GameMedia = {
  type: string;
  sourceUrl?: string | null;
  cachedUrl?: string | null;
  status: string;
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
  updatedAt: string;
  provider?: Provider;
  media?: GameMedia[];
};

type HealthResult = {
  ok?: boolean;
  payload?: { status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number };
  readiness?: { ready?: boolean; passed?: number; total?: number };
};

type PendingAction =
  | { kind: 'game-status'; game: Game; status: GameStatus }
  | { kind: 'provider-status'; provider: Provider; status: ProviderStatus }
  | { kind: 'sync-provider'; provider: Provider }
  | { kind: 'bulk-games'; status: GameStatus }
  | { kind: 'bulk-providers'; status: ProviderStatus };

const TABS: readonly { id: TabId; label: string; shortLabel: string }[] = [
  { id: 'overview', label: 'ภาพรวม', shortLabel: 'ภาพรวม' },
  { id: 'homepage', label: 'เกมหน้าแรก', shortLabel: 'หน้าแรก' },
  { id: 'games', label: 'เกมทั้งหมด', shortLabel: 'เกม' },
  { id: 'providers', label: 'ค่ายและ API', shortLabel: 'ค่าย' },
  { id: 'tournament', label: 'Tournament / Leaderboard', shortLabel: 'แข่งขัน' },
  { id: 'maintenance', label: 'Maintenance', shortLabel: 'ปิดปรับปรุง' },
];

export default function GameControlCenterPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [health, setHealth] = useState<Record<string, HealthResult>>({});
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'warning' | 'danger'>('neutral');
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => { void loadAll(); }, []);

  const metrics = useMemo(() => {
    const providerBlocked = providers.filter((provider) => provider.status !== 'ACTIVE').length;
    const providerReportedBlocked = games.filter((game) => {
      const reported = providerReportedStatus(game.metadata);
      return reported != null && reported !== 'ACTIVE';
    }).length;
    const effectiveAvailable = games.filter((game) => effectiveGameStatus(game) === 'ACTIVE').length;
    return {
      games: games.length,
      available: effectiveAvailable,
      featured: games.filter((game) => game.isFeatured).length,
      blocked: games.length - effectiveAvailable,
      providers: providers.length,
      providerBlocked,
      providerReportedBlocked,
    };
  }, [games, providers]);

  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games.filter((game) => {
      const matchesProvider = providerFilter === 'ALL' || game.providerId === providerFilter;
      const matchesQuery = !needle || `${game.name} ${game.providerGameCode} ${game.category} ${game.provider?.name ?? ''}`.toLowerCase().includes(needle);
      return matchesProvider && matchesQuery;
    });
  }, [games, providerFilter, query]);

  const featuredGames = useMemo(() => games.filter((game) => game.isFeatured).sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)), [games]);
  const attentionGames = useMemo(() => games.filter((game) => effectiveGameStatus(game) !== 'ACTIVE'), [games]);
  const pageBusy = loading || Boolean(busyKey);

  async function loadAll() {
    setLoading(true);
    setMessage('กำลังโหลดข้อมูลควบคุมเกม...');
    setMessageTone('neutral');
    try {
      const [gamesResponse, providersResponse] = await Promise.all([
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/game-providers'),
      ]);
      const [gamesPayload, providersPayload] = await Promise.all([
        gamesResponse.json().catch(() => null),
        providersResponse.json().catch(() => null),
      ]);
      if (!gamesResponse.ok || !Array.isArray(gamesPayload?.items)) throw new Error('games');
      if (!providersResponse.ok || !Array.isArray(providersPayload?.items)) throw new Error('providers');
      setGames(gamesPayload.items as Game[]);
      setProviders(providersPayload.items as Provider[]);
      setMessage('');
    } catch {
      setMessage('โหลดข้อมูลควบคุมเกมไม่สำเร็จ กรุณาลองใหม่');
      setMessageTone('danger');
    } finally {
      setLoading(false);
    }
  }

  async function patchGame(game: Game, patch: Partial<Pick<Game, 'status' | 'isFeatured' | 'isNew' | 'isPopular' | 'sortOrder'>>) {
    const key = `game:${game.id}`;
    if (busyKey) return false;
    setBusyKey(key);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/games/${game.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('patch-game');
      setGames((current) => current.map((item) => item.id === game.id ? { ...item, ...payload } : item));
      setMessage(`อัปเดต ${game.name} แล้ว`);
      setMessageTone('success');
      return true;
    } catch {
      setMessage(`อัปเดต ${game.name} ไม่สำเร็จ`);
      setMessageTone('danger');
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function patchProvider(provider: Provider, status: ProviderStatus) {
    const key = `provider:${provider.id}`;
    if (busyKey) return false;
    setBusyKey(key);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('patch-provider');
      setProviders((current) => current.map((item) => item.id === provider.id ? { ...item, ...payload } : item));
      setMessage(`อัปเดตสถานะ ${provider.name} แล้ว`);
      setMessageTone('success');
      return true;
    } catch {
      setMessage(`อัปเดตสถานะ ${provider.name} ไม่สำเร็จ`);
      setMessageTone('danger');
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function checkProvider(provider: Provider) {
    const key = `health:${provider.id}`;
    if (busyKey) return;
    setBusyKey(key);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}/health-check`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      const result = (payload ?? { ok: false, payload: { status: 'OFFLINE' } }) as HealthResult;
      setHealth((current) => ({ ...current, [provider.id]: result }));
      setMessage(response.ok && result.ok !== false ? `ตรวจ ${provider.name} สำเร็จ` : `${provider.name} ตอบกลับไม่สมบูรณ์`);
      setMessageTone(response.ok && result.ok !== false ? 'success' : 'warning');
    } catch {
      setHealth((current) => ({ ...current, [provider.id]: { ok: false, payload: { status: 'OFFLINE' } } }));
      setMessage(`ตรวจการเชื่อมต่อ ${provider.name} ไม่สำเร็จ`);
      setMessageTone('danger');
    } finally {
      setBusyKey('');
    }
  }

  async function syncProvider(provider: Provider) {
    const key = `sync:${provider.id}`;
    if (busyKey) return false;
    setBusyKey(key);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/game-providers/${provider.id}/sync-games`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok === false) throw new Error('sync-provider');
      setMessage(`ซิงก์ ${provider.name} แล้ว: เพิ่ม ${Number(payload?.created ?? 0)} อัปเดต ${Number(payload?.updated ?? 0)} ข้าม ${Number(payload?.skipped ?? 0)}`);
      setMessageTone('success');
      await loadAll();
      return true;
    } catch {
      setMessage(`ซิงก์เกมจาก ${provider.name} ไม่สำเร็จ`);
      setMessageTone('danger');
      return false;
    } finally {
      setBusyKey('');
    }
  }

  async function applyBulkGameStatus(status: GameStatus) {
    if (busyKey) return;
    setBusyKey('bulk:games');
    let failed = 0;
    for (const game of games) {
      try {
        const response = await adminApiFetch(`/admin/games/${game.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBusyKey('');
    setMessage(failed ? `อัปเดตเกมสำเร็จ ${games.length - failed} เกม ไม่สำเร็จ ${failed} เกม` : `อัปเดต ${games.length} เกมแล้ว`);
    setMessageTone(failed ? 'warning' : 'success');
    await loadAll();
  }

  async function applyBulkProviderStatus(status: ProviderStatus) {
    if (busyKey) return;
    setBusyKey('bulk:providers');
    let failed = 0;
    for (const provider of providers) {
      try {
        const response = await adminApiFetch(`/admin/game-providers/${provider.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBusyKey('');
    setMessage(failed ? `อัปเดตค่ายสำเร็จ ${providers.length - failed} ค่าย ไม่สำเร็จ ${failed} ค่าย` : `อัปเดต ${providers.length} ค่ายแล้ว`);
    setMessageTone(failed ? 'warning' : 'success');
    await loadAll();
  }

  async function confirmPending() {
    const action = pending;
    if (!action || busyKey) return;
    let success = true;
    if (action.kind === 'game-status') success = await patchGame(action.game, { status: action.status });
    if (action.kind === 'provider-status') success = await patchProvider(action.provider, action.status);
    if (action.kind === 'sync-provider') success = await syncProvider(action.provider);
    if (action.kind === 'bulk-games') await applyBulkGameStatus(action.status);
    if (action.kind === 'bulk-providers') await applyBulkProviderStatus(action.status);
    if (success) setPending(null);
  }

  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="Game Control Center" description="ควบคุมเกมหน้าแรก เกมทั้งหมด สถานะค่าย API และ Maintenance จากพื้นที่เดียว" actions={<><AdminLinkButton href="/games">ตัวแก้ไขเกมเต็มรูปแบบ</AdminLinkButton><AdminButton disabled={pageBusy} onClick={() => void loadAll()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    <div style={workspaceStyle}>
      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}

      <div style={tabBarStyle} role="tablist" aria-label="ส่วนจัดการเกม">
        {TABS.map((item) => <AdminButton key={item.id} size="compact" tone={tab === item.id ? 'primary' : 'secondary'} onClick={() => setTab(item.id)} aria-pressed={tab === item.id}>{item.label}</AdminButton>)}
      </div>

      <AdminMetricGrid>
        <AdminMetric title="เกมทั้งหมด" value={metrics.games.toLocaleString('th-TH')} helper={`พร้อมให้สมาชิก ${metrics.available.toLocaleString('th-TH')}`} />
        <AdminMetric title="เกมหน้าแรก" value={metrics.featured.toLocaleString('th-TH')} helper="ติดป้ายเกมแนะนำ" tone={metrics.featured ? 'success' : 'warning'} />
        <AdminMetric title="เกมถูกบล็อก" value={metrics.blocked.toLocaleString('th-TH')} helper={`ค่ายรายงานปิด ${metrics.providerReportedBlocked.toLocaleString('th-TH')}`} tone={metrics.blocked ? 'warning' : 'success'} />
        <AdminMetric title="ค่ายเกม" value={metrics.providers.toLocaleString('th-TH')} helper={`ต้องตรวจ ${metrics.providerBlocked.toLocaleString('th-TH')}`} tone={metrics.providerBlocked ? 'warning' : 'success'} />
      </AdminMetricGrid>

      {tab === 'overview' && <OverviewSection games={games} providers={providers} attentionGames={attentionGames} health={health} onOpenTab={setTab} />}
      {tab === 'homepage' && <HomepageSection games={featuredGames} allGames={games} busyKey={busyKey} onToggleFeatured={(game) => void patchGame(game, { isFeatured: !game.isFeatured })} onStatus={(game, status) => setPending({ kind: 'game-status', game, status })} />}
      {tab === 'games' && <GamesSection games={filteredGames} providers={providers} query={query} providerFilter={providerFilter} pageBusy={pageBusy} busyKey={busyKey} onQuery={setQuery} onProviderFilter={setProviderFilter} onToggleFeatured={(game) => void patchGame(game, { isFeatured: !game.isFeatured })} onStatus={(game, status) => setPending({ kind: 'game-status', game, status })} />}
      {tab === 'providers' && <ProvidersSection providers={providers} health={health} busyKey={busyKey} onHealth={(provider) => void checkProvider(provider)} onSync={(provider) => setPending({ kind: 'sync-provider', provider })} onStatus={(provider, status) => setPending({ kind: 'provider-status', provider, status })} />}
      {tab === 'tournament' && <TournamentSection />}
      {tab === 'maintenance' && <MaintenanceSection metrics={metrics} games={games} providers={providers} pageBusy={pageBusy} onBulkGames={(status) => setPending({ kind: 'bulk-games', status })} onBulkProviders={(status) => setPending({ kind: 'bulk-providers', status })} />}
    </div>

    <AdminConfirmDialog open={Boolean(pending)} title={pendingTitle(pending)} description={pendingDescription(pending)} confirmLabel={pendingConfirmLabel(pending)} tone={pendingTone(pending)} busy={Boolean(busyKey)} onCancel={() => { if (!busyKey) setPending(null); }} onConfirm={() => void confirmPending()} />
  </AdminPage>;
}

function OverviewSection({ games, providers, attentionGames, health, onOpenTab }: { games: Game[]; providers: Provider[]; attentionGames: Game[]; health: Record<string, HealthResult>; onOpenTab: (tab: TabId) => void }) {
  const checkedProviders = Object.keys(health).length;
  return <AdminGrid>
    <AdminCard title="สถานะที่ต้องจัดการ" description="รวมเหตุที่ทำให้สมาชิกเข้าเกมไม่ได้">
      <AdminStack>
        <AdminRow><span>เกมที่ Admin ปิดหรือปิดปรับปรุง</span><AdminBadge tone={games.some((game) => game.status !== 'ACTIVE') ? 'warning' : 'success'}>{games.filter((game) => game.status !== 'ACTIVE').length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
        <AdminRow><span>เกมที่ Provider รายงานว่าไม่พร้อม</span><AdminBadge tone={games.some((game) => providerReportedStatus(game.metadata) != null && providerReportedStatus(game.metadata) !== 'ACTIVE') ? 'warning' : 'success'}>{games.filter((game) => providerReportedStatus(game.metadata) != null && providerReportedStatus(game.metadata) !== 'ACTIVE').length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
        <AdminRow><span>ค่ายที่ไม่ได้อยู่สถานะพร้อมใช้</span><AdminBadge tone={providers.some((provider) => provider.status !== 'ACTIVE') ? 'warning' : 'success'}>{providers.filter((provider) => provider.status !== 'ACTIVE').length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
        <AdminRow><span>ค่ายที่ตรวจการเชื่อมต่อแล้ว</span><AdminBadge>{checkedProviders.toLocaleString('th-TH')}/{providers.length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
      </AdminStack>
    </AdminCard>
    <AdminCard title="ทางลัดงานประจำ" description="หน้าเชิงลึกยังคงอยู่สำหรับงานที่ต้องใช้รายละเอียดเต็ม">
      <div style={shortcutStyle}>
        <AdminButton tone="secondary" onClick={() => onOpenTab('homepage')}>จัดเกมหน้าแรก</AdminButton>
        <AdminButton tone="secondary" onClick={() => onOpenTab('providers')}>ตรวจค่ายและ API</AdminButton>
        <AdminButton tone="secondary" onClick={() => onOpenTab('maintenance')}>เปิด Maintenance</AdminButton>
        <AdminLinkButton href="/provider-credentials">Credential</AdminLinkButton>
        <AdminLinkButton href="/adapter-test">ทดสอบ API</AdminLinkButton>
        <AdminLinkButton href="/reconciliation-center">กระทบยอด</AdminLinkButton>
      </div>
    </AdminCard>
    <AdminCard title="เกมที่ถูกบล็อก" description="แสดงตามลำดับความสำคัญของสถานะจริง">
      <AdminStack>{attentionGames.slice(0, 8).map((game) => <AdminRow key={game.id}><div><strong>{game.name}</strong><p style={mutedStyle}>{game.provider?.name ?? game.providerId} · {game.category}</p></div><AdminBadge tone={gameTone(effectiveGameStatus(game))}>{gameStatusLabel(effectiveGameStatus(game))}</AdminBadge></AdminRow>)}{attentionGames.length === 0 && <AdminEmpty>ไม่มีเกมที่ถูกบล็อก</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminGrid>;
}

function HomepageSection({ games, allGames, busyKey, onToggleFeatured, onStatus }: { games: Game[]; allGames: Game[]; busyKey: string; onToggleFeatured: (game: Game) => void; onStatus: (game: Game, status: GameStatus) => void }) {
  return <>
    <AdminToolbar><div><strong>เกมหน้าแรก</strong><p style={mutedStyle}>ใช้ป้ายเกมแนะนำและลำดับ sortOrder จากข้อมูลจริง</p></div><AdminBadge>{games.length.toLocaleString('th-TH')}/{allGames.length.toLocaleString('th-TH')}</AdminBadge></AdminToolbar>
    <AdminStack>{games.map((game, index) => <GameCard key={game.id} game={game} rank={index + 1} busy={Boolean(busyKey)} onToggleFeatured={onToggleFeatured} onStatus={onStatus} />)}{games.length === 0 && <AdminEmpty>ยังไม่มีเกมหน้าแรก เปิดป้าย “เกมแนะนำ” จากแท็บเกมทั้งหมด</AdminEmpty>}</AdminStack>
  </>;
}

function GamesSection({ games, providers, query, providerFilter, pageBusy, busyKey, onQuery, onProviderFilter, onToggleFeatured, onStatus }: { games: Game[]; providers: Provider[]; query: string; providerFilter: string; pageBusy: boolean; busyKey: string; onQuery: (value: string) => void; onProviderFilter: (value: string) => void; onToggleFeatured: (game: Game) => void; onStatus: (game: Game, status: GameStatus) => void }) {
  return <>
    <AdminCard title="ค้นหาและกรอง" description="ค้นหาจากชื่อ รหัสเกม หมวด หรือชื่อค่าย">
      <AdminFilterBar resultText={`${games.length.toLocaleString('th-TH')} เกม`}>
        <input disabled={pageBusy} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="ค้นหาเกม" aria-label="ค้นหาเกม" />
        <select disabled={pageBusy} value={providerFilter} onChange={(event) => onProviderFilter(event.target.value)} aria-label="กรองตามค่าย">
          <option value="ALL">ทุกค่าย</option>
          {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
        </select>
      </AdminFilterBar>
    </AdminCard>
    <AdminStack>{games.map((game) => <GameCard key={game.id} game={game} busy={Boolean(busyKey)} onToggleFeatured={onToggleFeatured} onStatus={onStatus} />)}{games.length === 0 && <AdminEmpty>ไม่พบเกมตามตัวกรอง</AdminEmpty>}</AdminStack>
  </>;
}

function GameCard({ game, rank, busy, onToggleFeatured, onStatus }: { game: Game; rank?: number; busy: boolean; onToggleFeatured: (game: Game) => void; onStatus: (game: Game, status: GameStatus) => void }) {
  const effective = effectiveGameStatus(game);
  const reported = providerReportedStatus(game.metadata);
  const image = previewUrl(game);
  return <AdminCard>
    <AdminRow>
      <div style={identityStyle}>{rank != null && <div style={rankStyle}>{rank}</div>}{image ? <img src={image} alt="" style={previewStyle} /> : <div style={placeholderStyle}>ไม่มีรูป</div>}<div><strong>{game.name}</strong><p style={mutedStyle}>{game.provider?.name ?? game.providerId} · {game.providerGameCode} · {game.category}</p><p style={mutedStyle}>ลำดับ {game.sortOrder.toLocaleString('th-TH')} · อัปเดต {new Date(game.updatedAt).toLocaleString('th-TH')}</p></div></div>
      <div style={badgeStyle}><AdminBadge tone={gameTone(effective)}>{gameStatusLabel(effective)}</AdminBadge>{reported && <AdminBadge tone={gameTone(reported)}>Provider: {gameStatusLabel(reported)}</AdminBadge>}{game.isFeatured && <AdminBadge>หน้าแรก</AdminBadge>}{game.isNew && <AdminBadge>ใหม่</AdminBadge>}{game.isPopular && <AdminBadge>ยอดนิยม</AdminBadge>}</div>
    </AdminRow>
    <div style={actionStyle}>
      <AdminButton disabled={busy} tone="secondary" onClick={() => onToggleFeatured(game)}>{game.isFeatured ? 'เอาออกจากหน้าแรก' : 'แสดงหน้าแรก'}</AdminButton>
      <AdminButton disabled={busy} tone={game.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => onStatus(game, game.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE')}>{game.status === 'ACTIVE' ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</AdminButton>
      <AdminLinkButton href="/games">แก้รายละเอียดและรูป</AdminLinkButton>
    </div>
  </AdminCard>;
}

function ProvidersSection({ providers, health, busyKey, onHealth, onSync, onStatus }: { providers: Provider[]; health: Record<string, HealthResult>; busyKey: string; onHealth: (provider: Provider) => void; onSync: (provider: Provider) => void; onStatus: (provider: Provider, status: ProviderStatus) => void }) {
  return <AdminStack>{providers.map((provider) => {
    const result = health[provider.id];
    const observed = result?.payload?.status;
    const displayStatus = observed ?? provider.status;
    return <AdminCard key={provider.id}>
      <AdminRow>
        <div><strong>{provider.name}</strong><p style={mutedStyle}>{provider.code} · {provider.walletMode ?? 'ไม่ระบุ wallet mode'} · เกม {Number(provider._count?.games ?? 0).toLocaleString('th-TH')}</p><p style={mutedStyle}>Endpoint {Number(provider._count?.endpoints ?? 0)} · Credential {Number(provider._count?.credentials ?? 0)} · Webhook {Number(provider._count?.webhookLogs ?? 0)}</p></div>
        <div style={badgeStyle}><AdminBadge tone={providerTone(displayStatus)}>{providerStatusLabel(displayStatus)}</AdminBadge>{result?.payload?.latencyMs != null && <AdminBadge>{result.payload.latencyMs} ms</AdminBadge>}{result?.readiness && <AdminBadge tone={result.readiness.ready ? 'success' : 'warning'}>{result.readiness.passed ?? 0}/{result.readiness.total ?? 0}</AdminBadge>}</div>
      </AdminRow>
      <div style={actionStyle}>
        <AdminButton disabled={Boolean(busyKey)} onClick={() => onHealth(provider)}>{busyKey === `health:${provider.id}` ? 'กำลังตรวจ...' : 'ตรวจการเชื่อมต่อ'}</AdminButton>
        <AdminButton disabled={Boolean(busyKey)} tone="secondary" onClick={() => onSync(provider)}>ซิงก์เกมจาก API</AdminButton>
        <AdminButton disabled={Boolean(busyKey)} tone={provider.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => onStatus(provider, provider.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE')}>{provider.status === 'ACTIVE' ? 'ปิดทั้งค่าย' : 'เปิดค่าย'}</AdminButton>
        <AdminLinkButton href="/simple-game-settings">ตั้งค่าค่าย</AdminLinkButton>
      </div>
    </AdminCard>;
  })}{providers.length === 0 && <AdminEmpty>ยังไม่มีค่ายเกม</AdminEmpty>}</AdminStack>;
}

function TournamentSection() {
  return <AdminGrid>
    <AdminCard title="Tournament / Leaderboard" description="พื้นที่นี้จะเปิดใช้งานเมื่อมีแหล่งข้อมูลจริงและ API ที่ตรวจสอบได้">
      <AdminNotice tone="warning">ใน main ปัจจุบันยังไม่มี Tournament หรือ Leaderboard API ที่เป็นแหล่งข้อมูลจริง จึงยังไม่สร้างสวิตช์เปิดใช้งานปลอม ๆ</AdminNotice>
      <AdminStack>
        <AdminRow><span>ตาราง Tournament และช่วงเวลาแข่งขัน</span><AdminBadge tone="warning">ยังไม่มี Data Model</AdminBadge></AdminRow>
        <AdminRow><span>Leaderboard และกติกาจัดอันดับ</span><AdminBadge tone="warning">ยังไม่มี API</AdminBadge></AdminRow>
        <AdminRow><span>Radar Bot / Automation</span><AdminBadge tone="warning">ยังไม่มี Worker</AdminBadge></AdminRow>
        <AdminRow><span>ข้อมูลผลการแข่งขันจริง</span><AdminBadge tone="warning">ยังไม่เชื่อม Provider</AdminBadge></AdminRow>
      </AdminStack>
    </AdminCard>
    <AdminCard title="หน้าที่เกี่ยวข้อง" description="ใช้ตรวจ Feature Flag รายงาน และงาน Growth ที่มีอยู่แล้ว">
      <div style={shortcutStyle}><AdminLinkButton href="/settings/features">Feature controls</AdminLinkButton><AdminLinkButton href="/growth-center">Growth overview</AdminLinkButton><AdminLinkButton href="/reports">Reports</AdminLinkButton><AdminLinkButton href="/audit">Audit log</AdminLinkButton></div>
    </AdminCard>
  </AdminGrid>;
}

function MaintenanceSection({ metrics, games, providers, pageBusy, onBulkGames, onBulkProviders }: { metrics: { blocked: number; providerBlocked: number; providerReportedBlocked: number }; games: Game[]; providers: Provider[]; pageBusy: boolean; onBulkGames: (status: GameStatus) => void; onBulkProviders: (status: ProviderStatus) => void }) {
  return <AdminGrid>
    <AdminCard title="ปิดปรับปรุงระบบเกม" description="การปิดทั้งค่ายมีผลเหนือสถานะรายเกม และ API จะตรวจซ้ำก่อนเปิดเกม">
      <AdminStack>
        <AdminRow><span>เกมถูกบล็อกทั้งหมด</span><AdminBadge tone={metrics.blocked ? 'warning' : 'success'}>{metrics.blocked.toLocaleString('th-TH')}/{games.length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
        <AdminRow><span>ค่ายถูกปิดหรือปิดปรับปรุง</span><AdminBadge tone={metrics.providerBlocked ? 'warning' : 'success'}>{metrics.providerBlocked.toLocaleString('th-TH')}/{providers.length.toLocaleString('th-TH')}</AdminBadge></AdminRow>
        <AdminRow><span>Provider รายงานเกมไม่พร้อม</span><AdminBadge tone={metrics.providerReportedBlocked ? 'warning' : 'success'}>{metrics.providerReportedBlocked.toLocaleString('th-TH')}</AdminBadge></AdminRow>
      </AdminStack>
      <div style={actionStyle}><AdminButton disabled={pageBusy || games.length === 0} tone="danger" onClick={() => onBulkGames('MAINTENANCE')}>ปิดปรับปรุงทุกเกม</AdminButton><AdminButton disabled={pageBusy || games.length === 0} tone="success" onClick={() => onBulkGames('ACTIVE')}>เปิดทุกเกม</AdminButton><AdminButton disabled={pageBusy || providers.length === 0} tone="danger" onClick={() => onBulkProviders('MAINTENANCE')}>ปิดทุกค่าย</AdminButton><AdminButton disabled={pageBusy || providers.length === 0} tone="success" onClick={() => onBulkProviders('ACTIVE')}>เปิดทุกค่าย</AdminButton></div>
    </AdminCard>
    <AdminCard title="Maintenance หน้า Member" description="ใช้เมื่อจำเป็นต้องปิดหน้าเว็บไซต์หรือบริการอื่นนอกเหนือจากเกม">
      <AdminNotice>การปิดทุกเกมด้านบนไม่เท่ากับการปิดเว็บไซต์ Member ทั้งหมด ใช้หน้า Maintenance กลางเมื่อต้องหยุดบริการทั้งหน้า</AdminNotice>
      <div style={shortcutStyle}><AdminLinkButton href="/settings/maintenance">ตั้งค่า Maintenance กลาง</AdminLinkButton><AdminLinkButton href="/settings/features">Feature controls</AdminLinkButton><AdminLinkButton href="/provider-health">ดูสถานะค่ายละเอียด</AdminLinkButton><AdminLinkButton href="/audit">ตรวจ Audit log</AdminLinkButton></div>
    </AdminCard>
  </AdminGrid>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function providerReportedStatus(metadata: unknown): ProviderReportedStatus | null {
  const record = asRecord(metadata);
  const value = record.providerStatus ?? record.reportedStatus;
  return value === 'ACTIVE' || value === 'INACTIVE' || value === 'MAINTENANCE' || value === 'REMOVED' ? value : null;
}

function effectiveGameStatus(game: Game): GameStatus {
  if (game.provider?.status !== 'ACTIVE') return 'MAINTENANCE';
  if (game.status !== 'ACTIVE') return game.status;
  return providerReportedStatus(game.metadata) ?? 'ACTIVE';
}

function gameStatusLabel(status: string) {
  const labels: Record<string, string> = { ACTIVE: 'เปิดใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', REMOVED: 'นำออกแล้ว' };
  return labels[status] ?? status;
}

function providerStatusLabel(status: string) {
  const labels: Record<string, string> = { ACTIVE: 'พร้อมใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'ทำงานไม่เต็มที่', ONLINE: 'ออนไลน์', OFFLINE: 'ออฟไลน์' };
  return labels[status] ?? status;
}

function gameTone(status: string): BadgeTone {
  if (status === 'ACTIVE') return 'success';
  if (status === 'MAINTENANCE') return 'warning';
  if (status === 'REMOVED') return 'danger';
  return 'neutral';
}

function providerTone(status: string): BadgeTone {
  if (status === 'ACTIVE' || status === 'ONLINE') return 'success';
  if (status === 'MAINTENANCE' || status === 'DEGRADED') return 'warning';
  if (status === 'OFFLINE') return 'danger';
  return 'neutral';
}

function previewUrl(game: Game) {
  const media = (game.media ?? []).find((item) => ['COVER', 'THUMBNAIL', 'ICON'].includes(item.type));
  return media?.cachedUrl ?? media?.sourceUrl ?? '';
}

function pendingTitle(pending: PendingAction | null) {
  if (!pending) return '';
  if (pending.kind === 'game-status') return `${pending.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} ${pending.game.name}`;
  if (pending.kind === 'provider-status') return `${pending.status === 'ACTIVE' ? 'เปิด' : 'ปิด'}ค่าย ${pending.provider.name}`;
  if (pending.kind === 'sync-provider') return `ซิงก์เกมจาก ${pending.provider.name}`;
  if (pending.kind === 'bulk-games') return pending.status === 'ACTIVE' ? 'เปิดเกมทั้งหมด' : 'ปิดปรับปรุงทุกเกม';
  return pending.status === 'ACTIVE' ? 'เปิดค่ายทั้งหมด' : 'ปิดทุกค่าย';
}

function pendingDescription(pending: PendingAction | null) {
  if (!pending) return '';
  if (pending.kind === 'game-status') return pending.status === 'ACTIVE' ? 'เกมจะเปิดได้เมื่อค่ายและสถานะจาก Provider พร้อมด้วย' : 'เกมนี้จะถูกบล็อกจากหน้า Member และ API เปิดเกม';
  if (pending.kind === 'provider-status') return pending.status === 'ACTIVE' ? 'เกมในค่ายจะกลับมาเปิดตามสถานะรายเกมและสถานะ Provider' : 'เกมทุกเกมในค่ายนี้จะถูกบล็อกทันที';
  if (pending.kind === 'sync-provider') return 'ระบบจะดึงรายการเกมและสถานะล่าสุดจาก Provider API โดยยังคงสถานะที่ Admin กำหนดไว้';
  if (pending.kind === 'bulk-games') return 'ระบบจะอัปเดตสถานะเกมทีละรายการและบันทึก Audit ตาม API เดิม';
  return 'ระบบจะอัปเดตสถานะค่ายทีละรายการ การปิดค่ายมีผลเหนือสถานะเกมทั้งหมด';
}

function pendingConfirmLabel(pending: PendingAction | null) {
  if (!pending) return 'ยืนยัน';
  if (pending.kind === 'sync-provider') return 'เริ่มซิงก์';
  if (pending.kind === 'game-status' || pending.kind === 'provider-status' || pending.kind === 'bulk-games' || pending.kind === 'bulk-providers') return pending.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ยืนยันปิด';
  return 'ยืนยัน';
}

function pendingTone(pending: PendingAction | null): 'primary' | 'success' | 'danger' {
  if (!pending || pending.kind === 'sync-provider') return 'primary';
  return pending.status === 'ACTIVE' ? 'success' : 'danger';
}

const workspaceStyle = { display: 'grid', gap: 16, minWidth: 0 } as const;
const tabBarStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' };
const shortcutStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(170px,100%),1fr))', gap: 10 } as const;
const actionStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'center', marginTop: 14 };
const badgeStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'flex-end' as const, alignItems: 'center' };
const identityStyle = { display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const previewStyle = { width: 64, height: 64, borderRadius: 14, objectFit: 'cover' as const, background: '#0b1220', flex: '0 0 auto' };
const placeholderStyle = { width: 64, height: 64, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#0b1220', color: '#64748b', fontSize: 11, flex: '0 0 auto' } as const;
const rankStyle = { width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(59,130,246,.14)', color: '#93c5fd', fontWeight: 900, flex: '0 0 auto' } as const;
