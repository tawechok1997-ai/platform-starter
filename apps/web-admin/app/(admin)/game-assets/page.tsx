'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminDrawer,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminSkeleton,
} from '../_components/admin-ui';
import styles from './game-assets.module.css';

type TabKey = 'providers' | 'games';
type PlatformScope = 'shared' | 'pc' | 'mobile';
type ProviderAssetKind = 'logo' | 'badge' | 'card' | 'background' | 'title' | 'avatar';

type Provider = {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  status?: string;
  metadata?: unknown;
  _count?: { games?: number };
};

type Game = {
  id: string;
  name: string;
  providerGameCode: string;
  category: string;
  status: string;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  metadata?: unknown;
  provider?: { id?: string; name?: string; code?: string } | null;
};

type Selection =
  | { kind: 'provider'; item: Provider }
  | { kind: 'game'; item: Game };

type EditorValues = Record<string, string>;

const providerAssetKinds: readonly ProviderAssetKind[] = [
  'logo',
  'badge',
  'card',
  'background',
  'title',
  'avatar',
];
const scopes: readonly PlatformScope[] = ['shared', 'pc', 'mobile'];

const assetLabels: Record<ProviderAssetKind, string> = {
  logo: 'โลโก้หลัก',
  badge: 'ไอคอน Badge',
  card: 'รูปการ์ดค่าย',
  background: 'พื้นหลังค่าย',
  title: 'รูปชื่อค่าย',
  avatar: 'Avatar ค่าย',
};

const scopeLabels: Record<PlatformScope, string> = {
  shared: 'ใช้ร่วมกัน',
  pc: 'PC',
  mobile: 'Mobile',
};

export default function GameAssetsPage() {
  const [tab, setTab] = useState<TabKey>('providers');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [values, setValues] = useState<EditorValues>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => { void loadAll(); }, []);

  const canManage = permissions.includes('*')
    || permissions.includes('game.providers.manage')
    || permissions.includes('provider.update');
  const normalizedQuery = query.trim().toLocaleLowerCase('th');
  const filteredProviders = useMemo(() => providers.filter((provider) => (
    !normalizedQuery
    || `${provider.name} ${provider.code}`.toLocaleLowerCase('th').includes(normalizedQuery)
  )), [normalizedQuery, providers]);
  const filteredGames = useMemo(() => games.filter((game) => (
    !normalizedQuery
    || `${game.name} ${game.providerGameCode} ${game.category} ${game.provider?.name ?? ''} ${game.provider?.code ?? ''}`
      .toLocaleLowerCase('th')
      .includes(normalizedQuery)
  )), [games, normalizedQuery]);

  async function loadAll() {
    setLoading(true);
    setMessage('');
    setError(false);
    try {
      const [providerResponse, gameResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/game-providers?take=100'),
        adminApiFetch('/admin/games'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [providerPayload, gamePayload, mePayload] = await Promise.all([
        providerResponse.json().catch(() => null),
        gameResponse.json().catch(() => null),
        meResponse.json().catch(() => null),
      ]);
      if (!providerResponse.ok || !Array.isArray(providerPayload?.items)) throw new Error('providers');
      if (!gameResponse.ok || !Array.isArray(gamePayload?.items)) throw new Error('games');
      setProviders(providerPayload.items as Provider[]);
      setGames(gamePayload.items as Game[]);
      setPermissions(meResponse.ok && Array.isArray(mePayload?.permissions) ? mePayload.permissions : []);
    } catch {
      setError(true);
      setMessage('โหลดรูปเกมและรูปค่ายไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function openProvider(provider: Provider) {
    setSelection({ kind: 'provider', item: provider });
    setValues(providerEditorValues(provider));
    setMessage('');
    setError(false);
  }

  function openGame(game: Game) {
    setSelection({ kind: 'game', item: game });
    setValues(gameEditorValues(game));
    setMessage('');
    setError(false);
  }

  async function saveSelection() {
    if (!selection || !canManage || saving) return;
    setSaving(true);
    setMessage('');
    setError(false);
    const currentMetadata = record(selection.item.metadata);
    const currentPresentation = record(currentMetadata.presentation);
    const presentation = selection.kind === 'provider'
      ? writeProviderPresentation(currentPresentation, values)
      : writeGamePresentation(currentPresentation, values);
    const metadata = { ...currentMetadata, presentation };
    const endpoint = selection.kind === 'provider'
      ? `/admin/game-providers/${selection.item.id}`
      : `/admin/games/${selection.item.id}`;

    try {
      const response = await adminApiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ metadata }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? 'save');

      if (selection.kind === 'provider') {
        setProviders((current) => current.map((provider) => (
          provider.id === selection.item.id ? { ...provider, ...payload, metadata } : provider
        )));
        setSelection({ kind: 'provider', item: { ...selection.item, ...payload, metadata } });
      } else {
        setGames((current) => current.map((game) => (
          game.id === selection.item.id ? { ...game, ...payload, metadata } : game
        )));
        setSelection({ kind: 'game', item: { ...selection.item, ...payload, metadata } });
      }
      setMessage('บันทึกรูปกลางและค่าแยกแพลตฟอร์มแล้ว');
    } catch {
      setError(true);
      setMessage('บันทึกรูปไม่สำเร็จ กรุณาตรวจค่าแล้วลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      eyebrow="Game presentation"
      title="รูปเกมและรูปค่ายกลาง"
      description="กำหนดรูปที่ PC และ Mobile ใช้ร่วมกัน แล้วใส่ Override เฉพาะแพลตฟอร์มเฉพาะจุดที่จำเป็น"
      actions={<AdminButton disabled={loading || saving} onClick={() => void loadAll()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}
    >
      <div className={styles.workspace}>
        <AdminMetricGrid>
          <AdminMetric title="ค่ายเกม" value={providers.length.toLocaleString('th-TH')} />
          <AdminMetric title="เกมในระบบ" value={games.length.toLocaleString('th-TH')} />
          <AdminMetric title="ค่ายมีรูปกลาง" value={String(providers.filter(hasProviderSharedAsset).length)} tone="success" />
          <AdminMetric title="เกมมีรูปกลาง" value={String(games.filter(hasGameSharedAsset).length)} tone="success" />
        </AdminMetricGrid>

        {!loading && !canManage ? <AdminNotice tone="warning">บัญชีนี้ดูรูปได้ แต่ไม่มีสิทธิ์แก้ไขข้อมูลเกมหรือค่าย</AdminNotice> : null}
        {message ? <AdminNotice tone={error ? 'danger' : 'success'}>{message}</AdminNotice> : null}

        <AdminCard
          title="หลักการเลือก Asset"
          description="ระบบเลือก Mobile/PC Override ก่อน แล้วจึงใช้ค่ากลาง หากยังไม่มีจะใช้รูปจาก Catalog, Local Asset และ CDN ตามลำดับ"
        >
          <div className={styles.cardMeta}>
            <AdminBadge tone="success">Shared ใช้สองฝั่ง</AdminBadge>
            <AdminBadge>PC Override</AdminBadge>
            <AdminBadge>Mobile Override</AdminBadge>
            <AdminBadge tone="warning">รูปเกมและรูปค่ายแยกคนละชุดค่า</AdminBadge>
          </div>
        </AdminCard>

        <div className={styles.tabs} role="tablist" aria-label="เลือกรายการ Asset">
          <button type="button" className={`${styles.tab} ${tab === 'providers' ? styles.tabActive : ''}`} onClick={() => setTab('providers')}>ค่ายเกม ({providers.length})</button>
          <button type="button" className={`${styles.tab} ${tab === 'games' ? styles.tabActive : ''}`} onClick={() => setTab('games')}>เกม ({games.length})</button>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === 'providers' ? 'ค้นหาชื่อหรือรหัสค่าย' : 'ค้นหาชื่อเกม รหัสเกม หมวด หรือค่าย'}
            aria-label="ค้นหา"
          />
          <AdminBadge>{tab === 'providers' ? filteredProviders.length : filteredGames.length} รายการ</AdminBadge>
        </div>

        {loading ? <AdminSkeleton lines={8} /> : tab === 'providers' ? (
          filteredProviders.length ? <div className={styles.grid}>{filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} disabled={!canManage || saving} onOpen={() => openProvider(provider)} />
          ))}</div> : <AdminEmpty>ไม่พบค่ายเกมตามคำค้น</AdminEmpty>
        ) : (
          filteredGames.length ? <div className={styles.grid}>{filteredGames.map((game) => (
            <GameCard key={game.id} game={game} disabled={!canManage || saving} onOpen={() => openGame(game)} />
          ))}</div> : <AdminEmpty>ไม่พบเกมตามคำค้น</AdminEmpty>
        )}
      </div>

      <AdminDrawer
        open={Boolean(selection)}
        title={selection?.kind === 'provider' ? `รูปค่าย · ${selection.item.name}` : selection?.kind === 'game' ? `รูปเกม · ${selection.item.name}` : 'แก้ไขรูป'}
        description="ปล่อยช่อง Override ว่างเพื่อให้แพลตฟอร์มนั้นใช้ค่ากลาง"
        busy={saving}
        onClose={() => { if (!saving) setSelection(null); }}
      >
        {selection ? <div className={styles.editor}>
          {selection.kind === 'provider'
            ? <ProviderEditor values={values} onChange={setValues} />
            : <GameEditor values={values} onChange={setValues} />}
          <EffectivePreview selection={selection} values={values} />
          <div className={styles.actions}>
            <AdminButton tone="secondary" disabled={saving} onClick={() => setSelection(null)}>ยกเลิก</AdminButton>
            <AdminButton disabled={!canManage || saving} onClick={() => void saveSelection()}>{saving ? 'กำลังบันทึก...' : 'บันทึก Asset'}</AdminButton>
          </div>
        </div> : null}
      </AdminDrawer>
    </AdminPage>
  );
}

function ProviderCard({ provider, disabled, onOpen }: { provider: Provider; disabled: boolean; onOpen: () => void }) {
  const presentation = readPresentation(provider.metadata);
  const image = firstText(presentation.mobileCardUrl, presentation.sharedCardUrl, presentation.mobileLogoUrl, presentation.sharedLogoUrl, provider.logoUrl);
  return <article className={styles.itemCard}>
    <div className={styles.cardHead}>
      <div className={styles.cardCopy}><strong>{provider.name}</strong><span>{provider.code}</span></div>
      <AdminBadge tone={provider.status === 'ACTIVE' ? 'success' : 'warning'}>{provider.status ?? 'UNKNOWN'}</AdminBadge>
    </div>
    <AssetThumbnail src={image} alt={provider.name} />
    <div className={styles.cardMeta}>
      <span>{provider._count?.games ?? 0} เกม</span>
      {hasProviderSharedAsset(provider) ? <AdminBadge tone="success">Shared</AdminBadge> : <AdminBadge tone="warning">Fallback</AdminBadge>}
      {hasPlatformOverrides(presentation) ? <AdminBadge>Override</AdminBadge> : null}
    </div>
    <AdminButton tone="secondary" disabled={disabled} onClick={onOpen}>จัดการรูปค่าย</AdminButton>
  </article>;
}

function GameCard({ game, disabled, onOpen }: { game: Game; disabled: boolean; onOpen: () => void }) {
  const presentation = readPresentation(game.metadata);
  const image = firstText(presentation.mobileImageUrl, presentation.sharedImageUrl, presentation.pcImageUrl);
  return <article className={styles.itemCard}>
    <div className={styles.cardHead}>
      <div className={styles.cardCopy}><strong>{game.name}</strong><span>{game.provider?.name ?? game.provider?.code ?? '-'} · {game.category}</span></div>
      <AdminBadge tone={game.status === 'ACTIVE' ? 'success' : 'warning'}>{game.status}</AdminBadge>
    </div>
    <AssetThumbnail src={image} alt={game.name} />
    <div className={styles.cardMeta}>
      <span>{game.providerGameCode}</span>
      {game.isFeatured ? <AdminBadge tone="success">Highlight</AdminBadge> : null}
      {game.isPopular ? <AdminBadge tone="warning">Popular</AdminBadge> : null}
      {game.isNew ? <AdminBadge>New</AdminBadge> : null}
      {hasGameSharedAsset(game) ? <AdminBadge tone="success">Shared</AdminBadge> : <AdminBadge tone="warning">Catalog</AdminBadge>}
    </div>
    <AdminButton tone="secondary" disabled={disabled} onClick={onOpen}>จัดการรูปเกม</AdminButton>
  </article>;
}

function ProviderEditor({ values, onChange }: { values: EditorValues; onChange: (values: EditorValues) => void }) {
  return <>
    {providerAssetKinds.map((kind) => <section key={kind} className={styles.editorSection}>
      <h3>{assetLabels[kind]}</h3>
      <p>ค่ากลางจะใช้กับทั้ง PC และ Mobile ส่วน Override จะทำงานเฉพาะแพลตฟอร์มนั้น</p>
      <div className={styles.fieldGrid}>
        {scopes.map((scope) => {
          const key = providerFieldKey(kind, scope);
          return <AssetField key={key} label={scopeLabels[scope]} value={values[key] ?? ''} onChange={(value) => onChange({ ...values, [key]: value })} />;
        })}
      </div>
    </section>)}
  </>;
}

function GameEditor({ values, onChange }: { values: EditorValues; onChange: (values: EditorValues) => void }) {
  return <section className={styles.editorSection}>
    <h3>รูป/ไอคอนเกม</h3>
    <p>ใช้ Shared Image เป็นค่าเริ่มต้นของทั้งสองฝั่ง แล้วใส่ PC หรือ Mobile Image เมื่อเกมนั้นต้องใช้ภาพต่างกันจริง</p>
    <div className={styles.fieldGrid}>
      {scopes.map((scope) => {
        const key = gameFieldKey(scope);
        return <AssetField key={key} label={scopeLabels[scope]} value={values[key] ?? ''} onChange={(value) => onChange({ ...values, [key]: value })} />;
      })}
    </div>
  </section>;
}

function AssetField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.field}><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="URL หรือ path ภายในเว็บ" /></label>;
}

function EffectivePreview({ selection, values }: { selection: Selection; values: EditorValues }) {
  const pc = selection.kind === 'game'
    ? firstText(values.pcImageUrl, values.sharedImageUrl)
    : firstText(values.pcCardUrl, values.sharedCardUrl, values.pcLogoUrl, values.sharedLogoUrl, selection.item.logoUrl);
  const mobile = selection.kind === 'game'
    ? firstText(values.mobileImageUrl, values.sharedImageUrl)
    : firstText(values.mobileCardUrl, values.sharedCardUrl, values.mobileLogoUrl, values.sharedLogoUrl, selection.item.logoUrl);
  return <section className={styles.editorSection}>
    <h3>ตัวอย่างค่าที่ Member จะได้รับ</h3>
    <div className={styles.previewGrid}>
      <Preview label="PC" src={pc} />
      <Preview label="Mobile" src={mobile} />
    </div>
  </section>;
}

function Preview({ label, src }: { label: string; src: string }) {
  return <div className={styles.preview}><span>{label}</span><div className={styles.previewCanvas}>{src ? <img src={src} alt={`ตัวอย่าง ${label}`} /> : <span className={styles.emptyThumb}>ยังไม่มีรูป</span>}</div></div>;
}

function AssetThumbnail({ src, alt }: { src: string; alt: string }) {
  return <div className={styles.thumbnail}>{src ? <img src={src} alt={alt} loading="lazy" /> : <span className={styles.emptyThumb}>ยังใช้รูปจาก Catalog/CDN</span>}</div>;
}

function providerEditorValues(provider: Provider) {
  const presentation = readPresentation(provider.metadata);
  const values: EditorValues = {};
  providerAssetKinds.forEach((kind) => scopes.forEach((scope) => {
    const key = providerFieldKey(kind, scope);
    values[key] = text(presentation[key]);
  }));
  if (!values.sharedLogoUrl && provider.logoUrl) values.sharedLogoUrl = provider.logoUrl;
  return values;
}

function gameEditorValues(game: Game) {
  const presentation = readPresentation(game.metadata);
  return {
    sharedImageUrl: text(presentation.sharedImageUrl),
    pcImageUrl: text(presentation.pcImageUrl),
    mobileImageUrl: text(presentation.mobileImageUrl),
  };
}

function writeProviderPresentation(current: Record<string, unknown>, values: EditorValues) {
  const next = { ...current };
  providerAssetKinds.forEach((kind) => scopes.forEach((scope) => writeValue(next, providerFieldKey(kind, scope), values[providerFieldKey(kind, scope)])));
  return next;
}

function writeGamePresentation(current: Record<string, unknown>, values: EditorValues) {
  const next = { ...current };
  scopes.forEach((scope) => writeValue(next, gameFieldKey(scope), values[gameFieldKey(scope)]));
  return next;
}

function writeValue(target: Record<string, unknown>, key: string, value: string | undefined) {
  const normalized = String(value ?? '').trim();
  if (normalized) target[key] = normalized;
  else delete target[key];
}

function providerFieldKey(kind: ProviderAssetKind, scope: PlatformScope) {
  return `${scope}${kind.charAt(0).toUpperCase()}${kind.slice(1)}Url`;
}

function gameFieldKey(scope: PlatformScope) {
  return `${scope}ImageUrl`;
}

function readPresentation(metadata: unknown) {
  const source = record(metadata);
  const presentation = record(source.presentation);
  return Object.keys(presentation).length ? presentation : source;
}

function hasProviderSharedAsset(provider: Provider) {
  const presentation = readPresentation(provider.metadata);
  return Boolean(firstText(presentation.sharedLogoUrl, presentation.sharedBadgeUrl, presentation.sharedCardUrl, provider.logoUrl));
}

function hasGameSharedAsset(game: Game) {
  return Boolean(text(readPresentation(game.metadata).sharedImageUrl));
}

function hasPlatformOverrides(presentation: Record<string, unknown>) {
  return Object.keys(presentation).some((key) => /^(pc|mobile)[A-Z].*Url$/.test(key) && text(presentation[key]));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(...values: unknown[]) {
  return values.map(text).find(Boolean) ?? '';
}
