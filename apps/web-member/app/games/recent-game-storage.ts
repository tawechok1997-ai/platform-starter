'use client';

export type RecentGameRecord = {
  id: string;
  name: string;
  providerName: string;
  imageUrl: string | null;
  platform: string;
  category: string;
  lastPlayedAt: string;
};

const KEY = 'member_recent_games_v2';
const MAX_ITEMS = 16;

export function readRecentGames(): RecentGameRecord[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is RecentGameRecord => Boolean(item && typeof item.id === 'string' && typeof item.lastPlayedAt === 'string'))
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentGame(record: Omit<RecentGameRecord, 'lastPlayedAt'>): RecentGameRecord[] {
  const nextRecord: RecentGameRecord = { ...record, lastPlayedAt: new Date().toISOString() };
  const next = [nextRecord, ...readRecentGames().filter((item) => item.id !== record.id)].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked in privacy mode. The current session still continues.
  }
  return next;
}

export function formatLastPlayed(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return 'เล่นล่าสุด';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (diffMinutes < 1) return 'เมื่อสักครู่';
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} วันที่แล้ว` : new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(time));
}
