import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GAME_ASSET_NAMES = Array.from({ length: 22 }, (_, index) => `game-${String(index + 1).padStart(2, '0')}.webp`);
const PROVIDER_CODES = ['cq', 'evp', 'fachai', 'jili', 'joker', 'kingm', 'nlc', 'pg', 'pp', 'ps', 'rsg', 'ygr'] as const;
const PROVIDER_ASSET_NAMES = PROVIDER_CODES.map((code) => `provider-${code}.png`);
const BANK_CODES = ['baac', 'bay', 'bbl', 'cimbt', 'exim', 'ghb', 'gsb', 'kbank', 'kkp', 'ktb', 'lhfg', 'scb', 'tcd', 'tisco', 'tmn', 'ttb', 'uobt'] as const;
const BANK_ASSET_NAMES = BANK_CODES.map((code) => `bank-${code}.webp`);
const FOOTER_CODES = ['bmm', 'gamecare', 'gaminglab', 'gc', 'godaddy', 'group', 'iovation', 'itech'] as const;
const FOOTER_ASSET_NAMES = FOOTER_CODES.map((code) => `footer-${code}.webp`);

const ALLOWED = new Set([
  'logo.png',
  'icon-home.png',
  'icon-casino.png',
  'icon-slot.png',
  'icon-fish.png',
  'icon-sport.png',
  'icon-card.png',
  'icon-lotto.png',
  'icon-live.png',
  'promotion.png',
  'activity.png',
  'news.png',
  'promo-special.png',
  'promo-activity.png',
  'promo-news.png',
  'shortcut-promo.png',
  'shortcut-event.png',
  'shortcut-news.png',
  'mission.webp',
  'promo-side.jpg',
  'hero-winners.jpg',
  'hero-login.jpg',
  'hero-news.jpg',
  'tournament.png',
  'tournament.svg',
  'leader-board.svg',
  'jackpot.gif',
  'jackpot.webp',
  'live-bg.webp',
  'mini-game.webp',
  'icon-dailymission-dt.webp',
  'icon-luckywheel-dt.webp',
  'icon-open-gold.webp',
  'icongamehit.webp',
  'mostonline1.webp',
  'coin.webp',
  'fire.webp',
  'star.webp',
  'line.png',
  'rank1.webp',
  'rank2.webp',
  'rank3.webp',
  'rankBadgeTop3.svg',
  'rankBadgeOther.svg',
  ...GAME_ASSET_NAMES,
  ...PROVIDER_ASSET_NAMES,
  ...BANK_ASSET_NAMES,
  ...FOOTER_ASSET_NAMES,
]);

const SOURCE_NAMES: Record<string, string[]> = {
  'logo.png': ['logo.png', '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7(1).png', '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png'],
  'icon-home.png': ['icon-home.png', 'หน้าเเรก.png', 'หน้าหลัก.png'],
  'icon-casino.png': ['icon-casino.png', 'คาสิโน.png'],
  'icon-slot.png': ['icon-slot.png', 'สล็อต.png'],
  'icon-fish.png': ['icon-fish.png', 'ตกปลา.png'],
  'icon-sport.png': ['icon-sport.png', 'กีฬา.png'],
  'icon-card.png': ['icon-card.png', 'ไพ่.png'],
  'icon-lotto.png': ['icon-lotto.png', 'หวย.png'],
  'icon-live.png': ['icon-live.png', 'ถ่ายทอดสด.png'],
  'promotion.png': ['promo-special.png', 'โปรโมชัน.png', 'shortcut-promo.png', 'promotion.png'],
  'activity.png': ['promo-activity.png', 'กิจกรรม.png', 'shortcut-event.png', 'activity.png'],
  'news.png': ['promo-news.png', 'ข่าวสาร.png', 'shortcut-news.png', 'news.png'],
  'promo-special.png': ['promo-special.png', 'shortcut-promo.png', 'โปรโมชัน.png'],
  'promo-activity.png': ['promo-activity.png', 'shortcut-event.png', 'กิจกรรม.png'],
  'promo-news.png': ['promo-news.png', 'shortcut-news.png', 'ข่าวสาร.png'],
  'shortcut-promo.png': ['shortcut-promo.png', 'promo-special.png'],
  'shortcut-event.png': ['shortcut-event.png', 'promo-activity.png'],
  'shortcut-news.png': ['shortcut-news.png', 'promo-news.png'],
  'mission.webp': ['mission.webp', 'mission.png', 'กิจกรรม.png'],
  'promo-side.jpg': ['promo-side.jpg', 'promo-side.webp'],
  'hero-winners.jpg': ['hero-winners.jpg', 'hero-winners.webp'],
  'hero-login.jpg': ['hero-login.jpg', 'hero-login.webp'],
  'hero-news.jpg': ['hero-news.jpg', 'hero-news.webp'],
  'tournament.png': ['tournament.png', 'tournament.webp'],
  'tournament.svg': ['tournament.svg'],
  'leader-board.svg': ['leader-board.svg'],
  'jackpot.gif': ['jackpot.gif'],
  'jackpot.webp': ['jackpot.webp'],
  'live-bg.webp': ['live-bg.webp', 'background_live.webp'],
  'mini-game.webp': ['mini-game.webp'],
  'icon-dailymission-dt.webp': ['icon-dailymission-dt.webp', 'icon-dailymission.webp'],
  'icon-luckywheel-dt.webp': ['icon-luckywheel-dt.webp', 'icon-luckywheel.webp'],
  'icon-open-gold.webp': ['icon-open-gold.webp'],
  'icongamehit.webp': ['icongamehit.webp'],
  'mostonline1.webp': ['mostonline1.webp'],
  'coin.webp': ['coin.webp'],
  'fire.webp': ['fire.webp'],
  'star.webp': ['star.webp'],
  'line.png': ['line.png'],
  'rank1.webp': ['rank1.webp'],
  'rank2.webp': ['rank2.webp'],
  'rank3.webp': ['rank3.webp'],
  'rankBadgeTop3.svg': ['rankBadgeTop3.svg'],
  'rankBadgeOther.svg': ['rankBadgeOther.svg'],
  ...Object.fromEntries(PROVIDER_CODES.map((code) => [`provider-${code}.png`, [`provider-${code}.png`]])),
  ...Object.fromEntries(BANK_CODES.map((code) => [`bank-${code}.webp`, [`${code}.webp`, `${code.toUpperCase()}.webp`]])),
  ...Object.fromEntries(FOOTER_CODES.map((code) => [`footer-${code}.webp`, [`footer-${code}.webp`]])),
};

const cache = new Map<string, string | null>();

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!ALLOWED.has(name)) return new NextResponse('Not found', { status: 404 });

  const filePath = await resolveAsset(name);
  if (!filePath) return new NextResponse('Not found', { status: 404 });

  const body = await fs.readFile(filePath);
  return new NextResponse(body, {
    headers: {
      'content-type': contentTypeFor(filePath),
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

async function resolveAsset(publicName: string) {
  if (cache.has(publicName)) return cache.get(publicName) ?? null;

  const targets = sourceNamesFor(publicName);
  for (const root of candidateRoots()) {
    for (const target of targets) {
      const direct = path.join(root, target);
      if (await isFile(direct)) {
        cache.set(publicName, direct);
        return direct;
      }
    }

    const found = await findByBasename(root, new Set(targets), 8);
    if (found) {
      cache.set(publicName, found);
      return found;
    }
  }

  cache.set(publicName, null);
  return null;
}

function sourceNamesFor(publicName: string) {
  const configured = SOURCE_NAMES[publicName];
  if (configured) return configured;

  const match = /^game-(\d{2})\.webp$/.exec(publicName);
  if (!match) return [publicName];
  const stem = `game-${match[1]}`;
  return [`${stem}.webp`, `${stem}.jpg`, `${stem}.jpeg`, `${stem}.png`];
}

function candidateRoots() {
  const cwd = process.cwd();
  const relativeRoots = ['asset', 'assets', '../../asset', '../../assets', '../../../asset', '../../../assets', '../../../../asset', '../../../../assets'];
  return Array.from(new Set(relativeRoots.map((root) => path.resolve(cwd, root))));
}

async function findByBasename(root: string, targets: Set<string>, depth: number): Promise<string | null> {
  if (depth < 0) return null;

  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (entry.isFile() && targets.has(entry.name)) return path.join(root, entry.name);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findByBasename(path.join(root, entry.name), targets, depth - 1);
    if (found) return found;
  }

  return null;
}

async function isFile(filePath: string) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function contentTypeFor(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.webp') return 'image/webp';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';
  return 'image/png';
}
