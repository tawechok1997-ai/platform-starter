export type CompetitionEntry = {
  rank: number;
  user: string;
  score: string;
};

export type CompetitionShowcase = {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  jackpotLabel: string;
  jackpotCaption: string;
  leaderboard: CompetitionEntry[];
};

const DEFAULT_LEADERBOARD: CompetitionEntry[] = [
  { rank: 1, user: 'ZAXXXU709740', score: '20' },
  { rank: 2, user: 'ZAXXXM664100', score: '17' },
  { rank: 3, user: 'ZAXXXR440174', score: '13' },
];

export function buildCompetitionShowcase(
  overrides: Partial<Omit<CompetitionShowcase, 'leaderboard'>> & { leaderboard?: unknown } = {},
): CompetitionShowcase {
  return {
    eyebrow: safeText(overrides.eyebrow, 'TOURNAMENT'),
    title: safeText(overrides.title, 'การแข่งขันสำหรับสมาชิก'),
    subtitle: safeText(overrides.subtitle, 'ร่วมกิจกรรมและติดตามอันดับล่าสุด'),
    heroImageUrl: safeImageUrl(overrides.heroImageUrl) || '/images/member-lobby/noah345-reference/0018_1783665647358-f637b660-a3e9-46e3-989d-a62654566985_2945931932.jpg',
    jackpotLabel: safeMoneyLabel(overrides.jackpotLabel, '฿ 1,000,000.00'),
    jackpotCaption: safeText(overrides.jackpotCaption, 'ยอดรางวัลรวมกิจกรรม'),
    leaderboard: normalizeLeaderboard(overrides.leaderboard),
  };
}

export function normalizeLeaderboard(value: unknown): CompetitionEntry[] {
  if (!Array.isArray(value)) return DEFAULT_LEADERBOARD;

  const rows = value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const rank = Number(record.rank);
    const user = maskLeaderboardUser(record.user);
    const score = safeScore(record.score);
    if (!Number.isInteger(rank) || rank < 1 || rank > 99 || !user) return [];
    return [{ rank, user, score: score || String(Math.max(0, 20 - index * 3)) }];
  });

  const uniqueRanks = new Map<number, CompetitionEntry>();
  for (const row of rows) if (!uniqueRanks.has(row.rank)) uniqueRanks.set(row.rank, row);
  const normalized = [...uniqueRanks.values()].sort((a, b) => a.rank - b.rank).slice(0, 5);
  return normalized.length ? normalized : DEFAULT_LEADERBOARD;
}

function safeText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 120) : fallback;
}

function safeImageUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (candidate.startsWith('/')) return candidate;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return '';
}

function safeMoneyLabel(value: unknown, fallback: string) {
  const text = safeText(value, fallback);
  return /^[฿$€£¥\s\d,.+-]+$/.test(text) ? text : fallback;
}

function maskLeaderboardUser(value: unknown) {
  if (typeof value !== 'string') return '';
  const [localPart = ''] = value.trim().split('@', 1);
  const clean = localPart.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
  if (!clean) return '';
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 2)}XXX${clean.slice(-4)}`;
}

function safeScore(value: unknown) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 ? String(Math.round(score)) : '';
}
