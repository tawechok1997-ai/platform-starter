'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
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
  AdminStack,
  AdminToolbar,
} from '../../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../../admin-locale';
import styles from './game-tournaments.module.css';

type TournamentStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
type Game = { id: string; name: string; providerGameCode: string; category: string; status: string; provider?: { name?: string; code?: string } };
type LeaderboardEntry = { rank: number; userId: string; username: string; displayName: string | null; score: number };
type Leaderboard = { tournamentId: string; metric: 'GAME_LAUNCHES'; calculatedAt: string; windowStart: string; windowEnd: string; entries: LeaderboardEntry[] };
type Tournament = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: TournamentStatus;
  startsAt: string;
  endsAt: string;
  gameIds: string[];
  leaderboardSize: number;
  radarEnabled: boolean;
  radarIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
  leaderboard: Leaderboard | null;
  radarDue: boolean;
  nextRadarAt: string | null;
};
type TournamentResponse = { items: Tournament[]; summary?: { total?: number; active?: number; scheduled?: number; radarEnabled?: number } };
type FormState = {
  name: string;
  slug: string;
  description: string;
  status: TournamentStatus;
  startsAt: string;
  endsAt: string;
  gameIds: string[];
  leaderboardSize: string;
  radarEnabled: boolean;
  radarIntervalMinutes: string;
};

type Copy = {
  eyebrow: string; title: string; description: string; back: string; refresh: string; newTournament: string;
  total: string; active: string; scheduled: string; radarEnabled: string; loading: string; loadFailed: string; saved: string; actionFailed: string;
  listTitle: string; listDescription: string; noTournaments: string; editorTitle: string; createTitle: string; name: string; slug: string; descriptionField: string; status: string; startsAt: string; endsAt: string; leaderboardSize: string; radar: string; radarInterval: string; minutes: string; games: string; gameSearch: string; selectedGames: string; save: string; saving: string; runRadar: string; runningRadar: string; delete: string; cancel: string; deleteTitle: string; deleteDescription: string; confirmDelete: string; leaderboard: string; noLeaderboard: string; score: string; lastCalculated: string; nextRadar: string; radarDue: string; noPermission: string; gameLaunches: string;
};

const copy: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'แพลตฟอร์มเกม', title: 'Tournament และ Radar Bot', description: 'สร้างช่วงแข่งขัน เลือกเกม และคำนวณ Leaderboard จาก Game Session ที่เปิดจริง', back: 'กลับศูนย์ควบคุมเกม', refresh: 'อัปเดตข้อมูล', newTournament: 'สร้าง Tournament',
    total: 'ทั้งหมด', active: 'กำลังแข่งขัน', scheduled: 'รอเริ่ม', radarEnabled: 'เปิด Radar', loading: 'กำลังโหลดข้อมูล...', loadFailed: 'โหลดข้อมูล Tournament ไม่สำเร็จ', saved: 'บันทึก Tournament แล้ว', actionFailed: 'ดำเนินการไม่สำเร็จ',
    listTitle: 'รายการแข่งขัน', listDescription: 'สถานะ เวลา และรอบคำนวณล่าสุด', noTournaments: 'ยังไม่มี Tournament', editorTitle: 'แก้ไข Tournament', createTitle: 'สร้าง Tournament ใหม่', name: 'ชื่อการแข่งขัน', slug: 'Slug', descriptionField: 'รายละเอียด', status: 'สถานะ', startsAt: 'เริ่มแข่งขัน', endsAt: 'สิ้นสุด', leaderboardSize: 'จำนวนอันดับ', radar: 'เปิด Radar Bot', radarInterval: 'รอบคำนวณ', minutes: 'นาที', games: 'เกมที่ใช้แข่งขัน', gameSearch: 'ค้นหาเกมหรือค่าย', selectedGames: 'เลือกแล้ว', save: 'บันทึก', saving: 'กำลังบันทึก...', runRadar: 'คำนวณอันดับตอนนี้', runningRadar: 'กำลังคำนวณ...', delete: 'ลบ Tournament', cancel: 'ยกเลิก', deleteTitle: 'ยืนยันลบ Tournament', deleteDescription: 'กติกาและ Leaderboard cache ของรายการนี้จะถูกลบ', confirmDelete: 'ยืนยันลบ', leaderboard: 'Leaderboard ล่าสุด', noLeaderboard: 'ยังไม่มีข้อมูลอันดับ กดคำนวณหรือเปิด Radar Bot', score: 'จำนวนเปิดเกม', lastCalculated: 'คำนวณล่าสุด', nextRadar: 'รอบถัดไป', radarDue: 'ถึงรอบคำนวณ', noPermission: 'บัญชีนี้ดู Tournament ได้ แต่ไม่มีสิทธิ์แก้ไข', gameLaunches: 'Game launches',
  },
  en: {
    eyebrow: 'Game platform', title: 'Tournament and Radar Bot', description: 'Create competition windows, select games, and rank real game session launches', back: 'Back to game control', refresh: 'Refresh data', newTournament: 'Create tournament',
    total: 'Total', active: 'Active', scheduled: 'Scheduled', radarEnabled: 'Radar enabled', loading: 'Loading data...', loadFailed: 'Unable to load tournament data', saved: 'Tournament saved', actionFailed: 'Action failed',
    listTitle: 'Competitions', listDescription: 'Status, schedule, and latest calculation', noTournaments: 'No tournaments yet', editorTitle: 'Edit tournament', createTitle: 'Create tournament', name: 'Tournament name', slug: 'Slug', descriptionField: 'Description', status: 'Status', startsAt: 'Starts at', endsAt: 'Ends at', leaderboardSize: 'Leaderboard size', radar: 'Enable Radar Bot', radarInterval: 'Calculation interval', minutes: 'minutes', games: 'Competition games', gameSearch: 'Search game or provider', selectedGames: 'selected', save: 'Save', saving: 'Saving...', runRadar: 'Calculate leaderboard now', runningRadar: 'Calculating...', delete: 'Delete tournament', cancel: 'Cancel', deleteTitle: 'Delete tournament', deleteDescription: 'This tournament configuration and leaderboard cache will be removed', confirmDelete: 'Delete', leaderboard: 'Latest leaderboard', noLeaderboard: 'No leaderboard data yet. Run a calculation or enable Radar Bot', score: 'Game launches', lastCalculated: 'Last calculated', nextRadar: 'Next radar run', radarDue: 'Calculation due', noPermission: 'This account can view tournaments but cannot edit them', gameLaunches: 'Game launches',
  },
};

const statusValues: TournamentStatus[] = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

export default function GameTournamentPage() {
  const [locale] = useAdminLocale();
  const t = copy[locale];
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => newForm());
  const [gameQuery, setGameQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManage = permissions.includes('*') || permissions.includes('game.providers.manage') || permissions.includes('provider.update');
  const selectedTournament = tournaments.find((item) => item.id === selectedId) ?? null;
  const filteredGames = useMemo(() => {
    const needle = gameQuery.trim().toLocaleLowerCase(locale === 'th' ? 'th' : 'en');
    return games.filter((game) => !needle || `${game.name} ${game.providerGameCode} ${game.provider?.name ?? ''} ${game.provider?.code ?? ''}`.toLocaleLowerCase(locale === 'th' ? 'th' : 'en').includes(needle));
  }, [games, gameQuery, locale]);
  const summary = useMemo(() => ({
    total: tournaments.length,
    active: tournaments.filter((item) => item.status === 'ACTIVE').length,
    scheduled: tournaments.filter((item) => item.status === 'SCHEDULED').length,
    radarEnabled: tournaments.filter((item) => item.radarEnabled).length,
  }), [tournaments]);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll(preferredId?: string) {
    setLoading(true);
    setError(false);
    setMessage('');
    try {
      const [tournamentResponse, gamesResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/game-tournaments'),
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [tournamentData, gamesData, meData] = await Promise.all([
        tournamentResponse.json().catch(() => null),
        gamesResponse.json().catch(() => null),
        meResponse.json().catch(() => null),
      ]);
      if (!tournamentResponse.ok || !Array.isArray(tournamentData?.items)) throw new Error('tournaments');
      if (!gamesResponse.ok || !Array.isArray(gamesData?.items)) throw new Error('games');
      const nextTournaments = (tournamentData as TournamentResponse).items;
      setTournaments(nextTournaments);
      setGames(gamesData.items as Game[]);
      setPermissions(meResponse.ok && Array.isArray(meData?.permissions) ? meData.permissions : []);
      const nextId = preferredId ?? selectedId;
      const nextSelected = nextTournaments.find((item) => item.id === nextId) ?? nextTournaments[0] ?? null;
      if (nextSelected) selectTournament(nextSelected);
      else startCreate();
    } catch {
      setError(true);
      setMessage(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  function selectTournament(item: Tournament) {
    setSelectedId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description,
      status: item.status,
      startsAt: toLocalDateTime(item.startsAt),
      endsAt: toLocalDateTime(item.endsAt),
      gameIds: [...item.gameIds],
      leaderboardSize: String(item.leaderboardSize),
      radarEnabled: item.radarEnabled,
      radarIntervalMinutes: String(item.radarIntervalMinutes),
    });
    setGameQuery('');
    setMessage('');
    setError(false);
  }

  function startCreate() {
    setSelectedId(null);
    setForm(newForm());
    setGameQuery('');
    setMessage('');
    setError(false);
  }

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleGame(gameId: string) {
    patchForm('gameIds', form.gameIds.includes(gameId) ? form.gameIds.filter((id) => id !== gameId) : [...form.gameIds, gameId]);
  }

  async function saveTournament() {
    if (!canManage || busy) return;
    setBusy('save');
    setMessage('');
    setError(false);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim(),
        status: form.status,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        gameIds: form.gameIds,
        leaderboardSize: Number(form.leaderboardSize),
        radarEnabled: form.radarEnabled,
        radarIntervalMinutes: Number(form.radarIntervalMinutes),
      };
      const response = await adminApiFetch(selectedId ? `/admin/game-tournaments/${selectedId}` : '/admin/game-tournaments', {
        method: selectedId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.id) throw new Error('save');
      setMessage(t.saved);
      await loadAll(data.id as string);
    } catch {
      setError(true);
      setMessage(t.actionFailed);
    } finally {
      setBusy('');
    }
  }

  async function runRadar() {
    if (!selectedId || !canManage || busy) return;
    setBusy('radar');
    setMessage('');
    setError(false);
    try {
      const response = await adminApiFetch(`/admin/game-tournaments/${selectedId}/radar-run`, { method: 'POST' });
      if (!response.ok) throw new Error('radar');
      await loadAll(selectedId);
    } catch {
      setError(true);
      setMessage(t.actionFailed);
    } finally {
      setBusy('');
    }
  }

  async function removeTournament() {
    if (!selectedId || !canManage || busy) return;
    setBusy('delete');
    try {
      const response = await adminApiFetch(`/admin/game-tournaments/${selectedId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete');
      setDeleteOpen(false);
      await loadAll();
    } catch {
      setError(true);
      setMessage(t.actionFailed);
    } finally {
      setBusy('');
    }
  }

  return <AdminPage eyebrow={t.eyebrow} title={t.title} description={t.description} actions={<><AdminLinkButton href="/game-control">{t.back}</AdminLinkButton><AdminButton disabled={loading || Boolean(busy)} onClick={() => void loadAll(selectedId ?? undefined)}>{t.refresh}</AdminButton></>}>
    <div className={styles.workspace}>
      {message && <AdminNotice tone={error ? 'danger' : 'success'}>{message}</AdminNotice>}
      {!canManage && !loading && <AdminNotice tone="warning">{t.noPermission}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title={t.total} value={summary.total.toLocaleString(locale)} />
        <AdminMetric title={t.active} value={summary.active.toLocaleString(locale)} tone={summary.active ? 'success' : 'neutral'} />
        <AdminMetric title={t.scheduled} value={summary.scheduled.toLocaleString(locale)} tone={summary.scheduled ? 'brand' : 'neutral'} />
        <AdminMetric title={t.radarEnabled} value={summary.radarEnabled.toLocaleString(locale)} tone={summary.radarEnabled ? 'success' : 'warning'} />
      </AdminMetricGrid>

      <div className={styles.layout}>
        <AdminCard title={t.listTitle} description={t.listDescription} action={<AdminButton size="compact" disabled={!canManage || Boolean(busy)} onClick={startCreate}>{t.newTournament}</AdminButton>}>
          {loading ? <AdminNotice>{t.loading}</AdminNotice> : <div className={styles.list}>
            {tournaments.map((item) => <button key={item.id} type="button" className={`${styles.tournamentButton} ${selectedId === item.id ? styles.tournamentButtonActive : ''}`} onClick={() => selectTournament(item)}>
              <div className={styles.itemHead}><strong>{item.name}</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status, locale)}</AdminBadge></div>
              <div className={styles.itemMeta}><span>{formatDate(item.startsAt, locale)} → {formatDate(item.endsAt, locale)}</span><span>{item.gameIds.length.toLocaleString(locale)} {t.games}</span></div>
              <div className={styles.itemMeta}>{item.radarEnabled && <AdminBadge tone={item.radarDue ? 'warning' : 'success'}>{item.radarDue ? t.radarDue : t.radarEnabled}</AdminBadge>}<span>{item.leaderboard?.entries.length ?? 0} {t.leaderboard}</span></div>
            </button>)}
            {!tournaments.length && <AdminEmpty>{t.noTournaments}</AdminEmpty>}
          </div>}
        </AdminCard>

        <AdminStack>
          <AdminCard title={selectedTournament ? t.editorTitle : t.createTitle} description={selectedTournament ? `${selectedTournament.slug} · ${statusLabel(selectedTournament.status, locale)}` : undefined}>
            <div className={styles.form}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span>{t.name}</span><input disabled={!canManage || Boolean(busy)} value={form.name} onChange={(event) => { patchForm('name', event.target.value); if (!selectedId && !form.slug) patchForm('slug', slugify(event.target.value)); }} /></label>
                <label className={styles.field}><span>{t.slug}</span><input disabled={!canManage || Boolean(busy)} value={form.slug} onChange={(event) => patchForm('slug', slugify(event.target.value))} /></label>
                <label className={styles.fieldFull}><span>{t.descriptionField}</span><textarea disabled={!canManage || Boolean(busy)} value={form.description} onChange={(event) => patchForm('description', event.target.value)} /></label>
                <label className={styles.field}><span>{t.status}</span><select disabled={!canManage || Boolean(busy)} value={form.status} onChange={(event) => patchForm('status', event.target.value as TournamentStatus)}>{statusValues.map((status) => <option key={status} value={status}>{statusLabel(status, locale)}</option>)}</select></label>
                <label className={styles.field}><span>{t.leaderboardSize}</span><input type="number" min="5" max="200" disabled={!canManage || Boolean(busy)} value={form.leaderboardSize} onChange={(event) => patchForm('leaderboardSize', event.target.value)} /></label>
                <label className={styles.field}><span>{t.startsAt}</span><input type="datetime-local" disabled={!canManage || Boolean(busy)} value={form.startsAt} onChange={(event) => patchForm('startsAt', event.target.value)} /></label>
                <label className={styles.field}><span>{t.endsAt}</span><input type="datetime-local" disabled={!canManage || Boolean(busy)} value={form.endsAt} onChange={(event) => patchForm('endsAt', event.target.value)} /></label>
                <label className={styles.checkboxRow}><input type="checkbox" disabled={!canManage || Boolean(busy)} checked={form.radarEnabled} onChange={(event) => patchForm('radarEnabled', event.target.checked)} /><span>{t.radar}</span></label>
                <label className={styles.field}><span>{t.radarInterval} ({t.minutes})</span><input type="number" min="1" max="1440" disabled={!canManage || Boolean(busy)} value={form.radarIntervalMinutes} onChange={(event) => patchForm('radarIntervalMinutes', event.target.value)} /></label>
              </div>

              <div className={styles.gamePicker}>
                <div className={styles.gameHead}><strong>{t.games}</strong><AdminBadge>{form.gameIds.length.toLocaleString(locale)} {t.selectedGames}</AdminBadge></div>
                <input className={styles.searchInput} value={gameQuery} onChange={(event) => setGameQuery(event.target.value)} placeholder={t.gameSearch} />
                <div className={styles.gameList}>{filteredGames.map((game) => <label key={game.id} className={styles.gameOption}><input type="checkbox" disabled={!canManage || Boolean(busy)} checked={form.gameIds.includes(game.id)} onChange={() => toggleGame(game.id)} /><span><strong>{game.name}</strong><small>{game.provider?.name ?? game.provider?.code ?? '-'} · {game.category} · {game.providerGameCode}</small></span></label>)}</div>
              </div>

              <div className={styles.formActions}>
                <AdminButton disabled={!canManage || Boolean(busy) || !form.gameIds.length} onClick={() => void saveTournament()}>{busy === 'save' ? t.saving : t.save}</AdminButton>
                {selectedTournament && <AdminButton tone="secondary" disabled={!canManage || Boolean(busy)} onClick={() => void runRadar()}>{busy === 'radar' ? t.runningRadar : t.runRadar}</AdminButton>}
                {selectedTournament && <AdminButton tone="danger" disabled={!canManage || Boolean(busy)} onClick={() => setDeleteOpen(true)}>{t.delete}</AdminButton>}
                {!selectedTournament && <AdminButton tone="ghost" disabled={Boolean(busy)} onClick={startCreate}>{t.cancel}</AdminButton>}
              </div>
            </div>
          </AdminCard>

          {selectedTournament && <AdminCard title={t.leaderboard} description={`${t.gameLaunches} · ${selectedTournament.leaderboard?.calculatedAt ? `${t.lastCalculated}: ${formatDate(selectedTournament.leaderboard.calculatedAt, locale)}` : t.noLeaderboard}`} action={selectedTournament.nextRadarAt ? <AdminBadge tone={selectedTournament.radarDue ? 'warning' : 'neutral'}>{t.nextRadar}: {formatDate(selectedTournament.nextRadarAt, locale)}</AdminBadge> : undefined}>
            {selectedTournament.leaderboard?.entries.length ? <div className={styles.leaderboard}>{selectedTournament.leaderboard.entries.map((entry) => <div key={entry.userId} className={styles.leaderboardRow}><span className={styles.rank}>{entry.rank}</span><div><strong>{entry.displayName || entry.username}</strong><p className={styles.muted}>{entry.username}</p></div><span className={styles.score}>{entry.score.toLocaleString(locale)} {t.score}</span></div>)}</div> : <AdminEmpty>{t.noLeaderboard}</AdminEmpty>}
          </AdminCard>}
        </AdminStack>
      </div>
    </div>

    <AdminConfirmDialog open={deleteOpen} title={t.deleteTitle} description={t.deleteDescription} confirmLabel={t.confirmDelete} cancelLabel={t.cancel} tone="danger" busy={busy === 'delete'} onCancel={() => { if (!busy) setDeleteOpen(false); }} onConfirm={() => void removeTournament()} />
  </AdminPage>;
}

function newForm(): FormState {
  const start = new Date();
  start.setMinutes(start.getMinutes() + 30, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { name: '', slug: '', description: '', status: 'DRAFT', startsAt: toLocalDateTime(start.toISOString()), endsAt: toLocalDateTime(end.toISOString()), gameIds: [], leaderboardSize: '50', radarEnabled: false, radarIntervalMinutes: '15' };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string, locale: AdminLocale) {
  return new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusLabel(status: TournamentStatus, locale: AdminLocale) {
  const labels: Record<AdminLocale, Record<TournamentStatus, string>> = {
    th: { DRAFT: 'ฉบับร่าง', SCHEDULED: 'รอเริ่ม', ACTIVE: 'กำลังแข่งขัน', PAUSED: 'หยุดชั่วคราว', COMPLETED: 'จบแล้ว', CANCELLED: 'ยกเลิก' },
    en: { DRAFT: 'Draft', SCHEDULED: 'Scheduled', ACTIVE: 'Active', PAUSED: 'Paused', COMPLETED: 'Completed', CANCELLED: 'Cancelled' },
  };
  return labels[locale][status];
}

function statusTone(status: TournamentStatus): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'ACTIVE' || status === 'COMPLETED') return 'success';
  if (status === 'SCHEDULED' || status === 'PAUSED') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}
