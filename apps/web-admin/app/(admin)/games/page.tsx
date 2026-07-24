'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminFilterBar,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
  AdminToolbar,
} from '../_components/admin-ui';

type GameStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
type MediaType = 'COVER' | 'ICON' | 'THUMBNAIL' | 'BANNER' | 'LOGO' | 'FALLBACK';
type Provider = { id: string; name: string; code: string };
type GameMedia = { id: string; type: MediaType; sourceUrl?: string | null; cachedUrl?: string | null; status: string; isOverride: boolean };
type Game = { id: string; providerId: string; providerGameCode: string; name: string; category: string; status: GameStatus; sortOrder: number; isFeatured: boolean; isNew: boolean; isPopular: boolean; provider?: Provider; media?: GameMedia[]; updatedAt: string };
type GameForm = { id?: string; providerId: string; providerGameCode: string; name: string; category: string; status: GameStatus; sortOrder: string; isFeatured: boolean; isNew: boolean; isPopular: boolean };
type MediaForm = { gameId: string; type: MediaType; sourceUrl: string };
type PendingStatus = { item: Game; status: GameStatus };
type PendingBulkStatus = { status: GameStatus; games: Game[] };

const emptyForm: GameForm = { providerId: '', providerGameCode: '', name: '', category: 'slot', status: 'INACTIVE', sortOrder: '100', isFeatured: false, isNew: false, isPopular: false };
const emptyMediaForm: MediaForm = { gameId: '', type: 'COVER', sourceUrl: '' };
const statuses: GameStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REMOVED'];
const mediaTypes: MediaType[] = ['COVER', 'ICON', 'THUMBNAIL', 'BANNER', 'LOGO', 'FALLBACK'];

export default function GameCatalogPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<GameForm>(emptyForm);
  const [mediaForm, setMediaForm] = useState<MediaForm>(emptyMediaForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<PendingBulkStatus | null>(null);
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GameStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => { void loadAll(); }, []);

  const metrics = useMemo(() => ({
    total: games.length,
    active: games.filter((item) => item.status === 'ACTIVE').length,
    attention: games.filter((item) => item.status === 'MAINTENANCE' || item.status === 'REMOVED').length,
    missingMedia: games.filter((item) => (item.media ?? []).length === 0).length,
  }), [games]);
  const categories = useMemo(() => [...new Set(games.map((item) => item.category).filter(Boolean))].sort(), [games]);
  const visibleGames = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return games.filter((item) => (!keyword || `${item.name} ${item.providerGameCode} ${item.provider?.name ?? ''}`.toLowerCase().includes(keyword))
      && (providerFilter === 'ALL' || item.providerId === providerFilter)
      && (statusFilter === 'ALL' || item.status === statusFilter)
      && (categoryFilter === 'ALL' || item.category === categoryFilter));
  }, [games, query, providerFilter, statusFilter, categoryFilter]);
  const selectedGames = useMemo(() => games.filter((item) => selectedIds.includes(item.id)), [games, selectedIds]);
  const pageBusy = loading || saving || mediaSaving || Boolean(busyId) || bulkBusy;

  async function loadAll() {
    if (loading && games.length > 0) return;
    setLoading(true);
    setMessage('กำลังโหลดคลังเกม...');
    try {
      const [gamesRes, providersRes] = await Promise.all([
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/game-providers'),
      ]);
      const [gamesData, providersData] = await Promise.all([
        gamesRes.json().catch(() => null),
        providersRes.json().catch(() => null),
      ]);
      if (!gamesRes.ok || !gamesData || !Array.isArray(gamesData.items)) throw new Error('games');
      if (!providersRes.ok || !providersData || !Array.isArray(providersData.items)) throw new Error('providers');
      const gameItems = gamesData.items as Game[];
      const providerItems = providersData.items as Provider[];
      setGames(gameItems);
      setProviders(providerItems);
      setSelectedIds((current) => current.filter((id) => gameItems.some((item) => item.id === id)));
      setForm((current) => ({ ...current, providerId: current.providerId || providerItems[0]?.id || '' }));
      setMediaForm((current) => ({ ...current, gameId: current.gameId || gameItems[0]?.id || '' }));
      setMessage('');
    } catch {
      setGames([]);
      setProviders([]);
      setSelectedIds([]);
      setMessage('โหลดคลังเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof GameForm>(key: K, value: GameForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateMediaField<K extends keyof MediaForm>(key: K, value: MediaForm[K]) { setMediaForm((current) => ({ ...current, [key]: value })); }
  function editGame(item: Game) {
    if (pageBusy) return;
    setForm({ id: item.id, providerId: item.providerId, providerGameCode: item.providerGameCode, name: item.name, category: item.category, status: item.status, sortOrder: String(item.sortOrder), isFeatured: item.isFeatured, isNew: item.isNew, isPopular: item.isPopular });
    setMediaForm((current) => ({ ...current, gameId: item.id }));
    setMessage(`กำลังแก้ไข ${item.name}`);
  }
  function resetForm() { if (!pageBusy) { setForm({ ...emptyForm, providerId: providers[0]?.id || '' }); setMessage(''); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || mediaSaving || bulkBusy || busyId) return;
    const payload = { providerId: form.providerId, providerGameCode: form.providerGameCode.trim(), name: form.name.trim(), category: form.category.trim(), status: form.status, sortOrder: Number(form.sortOrder || 100), isFeatured: form.isFeatured, isNew: form.isNew, isPopular: form.isPopular };
    if (!payload.providerId || !payload.providerGameCode || !payload.name || !payload.category) { setMessage('กรุณากรอกค่าย รหัสเกม ชื่อเกม และหมวดหมู่'); return; }
    setSaving(true);
    setMessage('');
    try {
      const response = await adminApiFetch(form.id ? `/admin/games/${form.id}` : '/admin/games', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('save');
      setMessage(form.id ? 'บันทึกข้อมูลเกมแล้ว' : 'เพิ่มเกมแล้ว');
      setForm({ ...emptyForm, providerId: providers[0]?.id || '' });
      await loadAll();
    } catch {
      setMessage('บันทึกเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  async function submitMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mediaSaving || loading || saving || bulkBusy || busyId) return;
    const sourceUrl = mediaForm.sourceUrl.trim();
    if (!mediaForm.gameId || !sourceUrl) { setMessage('กรุณาเลือกเกมและใส่ URL รูป'); return; }
    setMediaSaving(true);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/games/${mediaForm.gameId}/media`, { method: 'POST', body: JSON.stringify({ type: mediaForm.type, sourceUrl, cachedUrl: sourceUrl, status: 'READY', isOverride: true }) });
      if (!response.ok) throw new Error('media');
      setMediaForm({ ...emptyMediaForm, gameId: mediaForm.gameId });
      setMessage('บันทึกรูปเกมแล้ว');
      await loadAll();
    } catch {
      setMessage('บันทึกรูปเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setMediaSaving(false);
    }
  }

  async function patchGame(item: Game, patch: Partial<Game>) {
    if (busyId || loading || saving || mediaSaving || bulkBusy) return false;
    setBusyId(item.id);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/games/${item.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== 'object') throw new Error('patch');
      setGames((current) => current.map((game) => game.id === item.id ? { ...game, ...payload } : game));
      setMessage('อัปเดตเกมแล้ว');
      return true;
    } catch {
      setMessage('อัปเดตเกมไม่สำเร็จ กรุณาลองใหม่');
      return false;
    } finally {
      setBusyId('');
    }
  }

  async function confirmStatus() {
    if (!pendingStatus || busyId) return;
    const action = pendingStatus;
    const success = await patchGame(action.item, { status: action.status });
    if (success) setPendingStatus(null);
  }

  async function confirmBulkStatus() {
    if (!pendingBulkStatus || bulkBusy || busyId) return;
    const action = pendingBulkStatus;
    setBulkBusy(true);
    setMessage('');
    let failed = 0;
    try {
      for (const item of action.games) {
        try {
          const response = await adminApiFetch(`/admin/games/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: action.status }) });
          if (!response.ok) failed += 1;
        } catch {
          failed += 1;
        }
      }
      setSelectedIds([]);
      setPendingBulkStatus(null);
      setMessage(failed ? `อัปเดตสำเร็จ ${action.games.length - failed} เกม, ไม่สำเร็จ ${failed} เกม` : `อัปเดต ${action.games.length} เกมแล้ว`);
      await loadAll();
    } catch {
      setMessage('อัปเดตหลายเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelected(id: string) { if (!pageBusy) setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function toggleAllVisible() { if (!pageBusy) setSelectedIds((current) => visibleGames.every((item) => current.includes(item.id)) ? current.filter((id) => !visibleGames.some((item) => item.id === id)) : [...new Set([...current, ...visibleGames.map((item) => item.id)])]); }

  return <AdminPage eyebrow="แพลตฟอร์มเกม" title="คลังเกม" description="จัดการรายชื่อเกม หมวดหมู่ สถานะ ป้ายแนะนำ และสื่อที่แสดงต่อสมาชิก" actions={<AdminButton onClick={() => void loadAll()} disabled={pageBusy}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    <AdminMetricGrid>
      <AdminMetric title="เกมทั้งหมด" value={String(metrics.total)} />
      <AdminMetric title="เปิดใช้งาน" value={String(metrics.active)} tone="success" />
      <AdminMetric title="ต้องตรวจ" value={String(metrics.attention)} tone={metrics.attention ? 'warning' : 'success'} />
      <AdminMetric title="ยังไม่มีรูป" value={String(metrics.missingMedia)} tone={metrics.missingMedia ? 'warning' : 'success'} />
    </AdminMetricGrid>
    {message && <AdminNotice>{message}</AdminNotice>}

    <AdminCard title={form.id ? 'แก้ไขเกม' : 'เพิ่มเกม'} description="กรอกข้อมูลพื้นฐานให้ครบก่อนเปิดเกมต่อสมาชิก">
      <form onSubmit={submit} style={formStyle}>
        <label style={labelStyle}>ค่ายเกม<select disabled={pageBusy} value={form.providerId} onChange={(event) => updateField('providerId', event.target.value)} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></label>
        <label style={labelStyle}>รหัสเกมจากค่าย<input disabled={pageBusy} value={form.providerGameCode} onChange={(event) => updateField('providerGameCode', event.target.value)} style={inputStyle} placeholder="เช่น demo-slot-001" /></label>
        <label style={labelStyle}>ชื่อเกม<input disabled={pageBusy} value={form.name} onChange={(event) => updateField('name', event.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>หมวดหมู่<input disabled={pageBusy} value={form.category} onChange={(event) => updateField('category', event.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>สถานะ<select disabled={pageBusy} value={form.status} onChange={(event) => updateField('status', event.target.value as GameStatus)} style={inputStyle}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
        <label style={labelStyle}>ลำดับ<input disabled={pageBusy} value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} inputMode="numeric" style={inputStyle} /></label>
        <label style={checkStyle}><input disabled={pageBusy} type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} /> เกมแนะนำ</label>
        <label style={checkStyle}><input disabled={pageBusy} type="checkbox" checked={form.isNew} onChange={(event) => updateField('isNew', event.target.checked)} /> เกมใหม่</label>
        <label style={checkStyle}><input disabled={pageBusy} type="checkbox" checked={form.isPopular} onChange={(event) => updateField('isPopular', event.target.checked)} /> เกมยอดนิยม</label>
        <div style={actionRowStyle}><AdminButton type="submit" disabled={pageBusy}>{saving ? 'กำลังบันทึก...' : form.id ? 'บันทึกเกม' : 'เพิ่มเกม'}</AdminButton>{form.id && <AdminButton type="button" tone="secondary" disabled={pageBusy} onClick={resetForm}>ยกเลิกการแก้ไข</AdminButton>}</div>
      </form>
    </AdminCard>

    <AdminCard title="รูปและสื่อของเกม" description="เพิ่มภาพปก ไอคอน แบนเนอร์ หรือภาพสำรอง">
      <form onSubmit={submitMedia} style={formStyle}>
        <label style={labelStyle}>เกม<select disabled={pageBusy} value={mediaForm.gameId} onChange={(event) => updateMediaField('gameId', event.target.value)} style={inputStyle}>{games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
        <label style={labelStyle}>ประเภท<select disabled={pageBusy} value={mediaForm.type} onChange={(event) => updateMediaField('type', event.target.value as MediaType)} style={inputStyle}>{mediaTypes.map((type) => <option key={type} value={type}>{mediaLabel(type)}</option>)}</select></label>
        <label style={labelStyle}>URL รูป<input disabled={pageBusy} value={mediaForm.sourceUrl} onChange={(event) => updateMediaField('sourceUrl', event.target.value)} style={inputStyle} placeholder="https://..." /></label>
        <div style={actionRowStyle}><AdminButton type="submit" disabled={pageBusy}>{mediaSaving ? 'กำลังเพิ่มรูป...' : 'เพิ่มรูป'}</AdminButton></div>
      </form>
    </AdminCard>

    <AdminToolbar><strong>รายชื่อเกม</strong><span style={mutedStyle}>{loading ? 'กำลังโหลด...' : `${visibleGames.length}/${games.length} เกม`}</span></AdminToolbar>
    <AdminFilterBar resultText={`เลือก ${selectedGames.length} เกม`}><label style={filterLabelStyle}>ค้นหา<input disabled={pageBusy} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ, รหัส, ค่าย" style={inputStyle} /></label><label style={filterLabelStyle}>ค่าย<select disabled={pageBusy} value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} style={inputStyle}><option value="ALL">ทุกค่าย</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label><label style={filterLabelStyle}>สถานะ<select disabled={pageBusy} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | GameStatus)} style={inputStyle}><option value="ALL">ทุกสถานะ</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label style={filterLabelStyle}>หมวด<select disabled={pageBusy} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={inputStyle}><option value="ALL">ทุกหมวด</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></AdminFilterBar>
    <AdminToolbar><label style={checkStyle}><input disabled={pageBusy} type="checkbox" checked={visibleGames.length > 0 && visibleGames.every((item) => selectedIds.includes(item.id))} onChange={toggleAllVisible} /> เลือกทั้งหมดที่แสดง</label><div style={actionRowStyle}><AdminButton tone="success" disabled={selectedGames.length === 0 || pageBusy} onClick={() => setPendingBulkStatus({ status: 'ACTIVE', games: selectedGames })}>เปิด {selectedGames.length}</AdminButton><AdminButton tone="danger" disabled={selectedGames.length === 0 || pageBusy} onClick={() => setPendingBulkStatus({ status: 'INACTIVE', games: selectedGames })}>ปิด {selectedGames.length}</AdminButton></div></AdminToolbar>
    <AdminStack>{visibleGames.map((item) => <AdminCard key={item.id}>
      <AdminRow>
        <div style={gameSummaryStyle}><label style={checkStyle}><input disabled={pageBusy} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`เลือก ${item.name}`} /></label>{previewUrl(item) ? <img src={previewUrl(item)} alt="" style={previewStyle} /> : <div style={previewPlaceholderStyle}>ไม่มีรูป</div>}<div><h2 style={gameNameStyle}>{item.name}</h2><p style={mutedStyle}>{item.provider?.name ?? item.providerId} · {item.providerGameCode} · {item.category}</p><p style={smallMutedStyle}>สื่อ {(item.media ?? []).length} รายการ</p></div></div>
        <div style={badgeStackStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.isFeatured && <AdminBadge>แนะนำ</AdminBadge>}{item.isNew && <AdminBadge>ใหม่</AdminBadge>}{item.isPopular && <AdminBadge>ยอดนิยม</AdminBadge>}</div>
      </AdminRow>
      <div style={actionRowStyle}>
        <AdminButton tone="secondary" disabled={pageBusy} onClick={() => editGame(item)}>แก้ไข</AdminButton>
        <AdminButton disabled={pageBusy} tone={item.status === 'ACTIVE' ? 'danger' : 'success'} onClick={() => setPendingStatus({ item, status: item.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' })}>{item.status === 'ACTIVE' ? 'ปิดปรับปรุง' : 'เปิดใช้งาน'}</AdminButton>
        <AdminButton disabled={pageBusy} tone="secondary" onClick={() => void patchGame(item, { isFeatured: !item.isFeatured })}>{item.isFeatured ? 'เลิกแนะนำ' : 'ตั้งเป็นเกมแนะนำ'}</AdminButton>
        <AdminButton disabled={pageBusy} tone="secondary" onClick={() => void patchGame(item, { isNew: !item.isNew })}>{item.isNew ? 'เอาป้ายใหม่ออก' : 'ติดป้ายเกมใหม่'}</AdminButton>
        <AdminButton disabled={pageBusy} tone="secondary" onClick={() => void patchGame(item, { isPopular: !item.isPopular })}>{item.isPopular ? 'เอาป้ายยอดนิยมออก' : 'ติดป้ายยอดนิยม'}</AdminButton>
      </div>
      <p style={smallMutedStyle}>ลำดับ {item.sortOrder} · อัปเดต {new Date(item.updatedAt).toLocaleString('th-TH')}</p>
    </AdminCard>)}{!loading && visibleGames.length === 0 && <AdminEmpty>{games.length === 0 ? 'ยังไม่มีเกม' : 'ไม่พบเกมตามตัวกรอง'}</AdminEmpty>}</AdminStack>

    <AdminConfirmDialog open={Boolean(pendingStatus)} title={pendingStatus ? `${pendingStatus.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} ${pendingStatus.item.name}` : ''} description={pendingStatus?.status === 'ACTIVE' ? 'เกมจะกลับมาแสดงและพร้อมให้สมาชิกเปิดใช้งาน' : 'เกมจะถูกซ่อนจากการใช้งานระหว่างตรวจสอบหรือปรับปรุง'} confirmLabel={pendingStatus?.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'} tone={pendingStatus?.status === 'ACTIVE' ? 'success' : 'danger'} busy={Boolean(pendingStatus && busyId === pendingStatus.item.id)} onCancel={() => { if (!busyId) setPendingStatus(null); }} onConfirm={() => void confirmStatus()} />
    <AdminConfirmDialog open={Boolean(pendingBulkStatus)} title={pendingBulkStatus ? `${pendingBulkStatus.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} ${pendingBulkStatus.games.length} เกม` : ''} description={pendingBulkStatus?.status === 'ACTIVE' ? 'เกมที่เลือกจะเปิดใช้งานตามลำดับ' : 'เกมที่เลือกจะถูกปิดใช้งานตามลำดับ'} confirmLabel={pendingBulkStatus?.status === 'ACTIVE' ? 'เปิดใช้งานทั้งหมด' : 'ปิดใช้งานทั้งหมด'} tone={pendingBulkStatus?.status === 'ACTIVE' ? 'success' : 'danger'} busy={bulkBusy} onCancel={() => { if (!bulkBusy) setPendingBulkStatus(null); }} onConfirm={() => void confirmBulkStatus()} />
  </AdminPage>;
}

function statusLabel(status: GameStatus) { return ({ ACTIVE: 'เปิดใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', REMOVED: 'นำออกแล้ว' } as Record<GameStatus, string>)[status]; }
function mediaLabel(type: MediaType) { return ({ COVER: 'ภาพปก', ICON: 'ไอคอน', THUMBNAIL: 'ภาพย่อ', BANNER: 'แบนเนอร์', LOGO: 'โลโก้', FALLBACK: 'ภาพสำรอง' } as Record<MediaType, string>)[type]; }
function statusTone(status: GameStatus) { if (status === 'ACTIVE') return 'success'; if (status === 'MAINTENANCE') return 'warning'; if (status === 'REMOVED') return 'danger'; return 'neutral'; }
function previewUrl(game: Game) { const media = (game.media ?? []).find((item) => ['COVER', 'THUMBNAIL', 'ICON'].includes(item.type)); return media?.cachedUrl ?? media?.sourceUrl ?? ''; }
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: 12, minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#cbd5e1', fontWeight: 900, minWidth: 0 } as const;
const filterLabelStyle = { ...labelStyle, minWidth: 'min(100%, 180px)' } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const checkStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontWeight: 900 } as const;
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { margin: 0, color: '#64748b', fontSize: 12 } as const;
const badgeStackStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const };
const gameSummaryStyle = { display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 } as const;
const previewStyle = { width: 56, height: 56, borderRadius: 12, objectFit: 'cover' as const, background: '#0b1220' } as const;
const previewPlaceholderStyle = { width: 56, height: 56, borderRadius: 12, display: 'grid', placeItems: 'center', flex: '0 0 auto', background: '#172033', color: '#94a3b8', fontSize: 11 } as const;
const gameNameStyle = { margin: 0, fontSize: 22, lineHeight: 1.12 } as const;
