import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GAME_ASSET_NAMES = Array.from({ length: 22 }, (_, index) => `game-${String(index + 1).padStart(2, '0')}.webp`);

const ALLOWED = new Set([
  'home.png',
  'promotion.png',
  'activity.png',
  'news.png',
  'mission.png',
  'fish.png',
  'slot.png',
  'casino.png',
  'live.png',
  'loto.png',
  'card.png',
  'sport.png',
  'logo.png',
  'promo-side.webp',
  'hero-winners.webp',
  'hero-login.webp',
  'hero-news.webp',
  'tournament.webp',
  'icon-dailymission.webp',
  'icon-luckywheel.webp',
  ...GAME_ASSET_NAMES,
]);

const SOURCE_NAMES: Record<string, string[]> = {
  'logo.png': [
    '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7(1).png',
    '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png',
    'logo.png',
  ],
  'home.png': ['หน้าเเรก.png', 'หน้าหลัก.png', 'icon-home.png', 'home.png'],
  'promotion.png': ['โปรโมชัน.png', 'shortcut-promo.png', 'promotion.png'],
  'activity.png': ['กิจกรรม.png', 'shortcut-event.png', 'activity.png'],
  'news.png': ['ข่าวสาร.png', 'shortcut-news.png', 'news.png'],
  'mission.png': ['กิจกรรม.png', 'mission.webp', 'mission.png'],
  'casino.png': ['คาสิโน.png', 'icon-casino.png', 'casino.png'],
  'slot.png': ['สล็อต.png', 'icon-slot.png', 'slot.png'],
  'fish.png': ['ตกปลา.png', 'icon-fish.png', 'fish.png'],
  'sport.png': ['กีฬา.png', 'icon-sport.png', 'sport.png'],
  'card.png': ['ไพ่.png', 'icon-card.png', 'card.png'],
  'loto.png': ['หวย.png', 'icon-lotto.png', 'loto.png'],
  'live.png': ['ถ่ายทอดสด.png', 'icon-live.png', 'live.png'],
  'promo-side.webp': ['promo-side.webp', 'promo-side.jpg'],
  'hero-winners.webp': ['hero-winners.webp', 'hero-winners.jpg'],
  'hero-login.webp': ['hero-login.webp', 'hero-login.jpg'],
  'hero-news.webp': ['hero-news.webp', 'hero-news.jpg'],
  'tournament.webp': ['tournament.webp', 'tournament.png'],
  'icon-dailymission.webp': ['icon-dailymission.webp', 'icon-dailymission-dt.webp'],
  'icon-luckywheel.webp': ['icon-luckywheel.webp', 'icon-luckywheel-dt.webp'],
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
  const roots = candidateRoots();

  for (const root of roots) {
    for (const target of targets) {
      const direct = path.join(root, target);
      if (await isFile(direct)) {
        cache.set(publicName, direct);
        return direct;
      }
    }

    const found = await findByBasename(root, new Set(targets), 7);
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
  return Array.from(new Set([
    path.resolve(cwd, 'asset'),
    path.resolve(cwd, '../../asset'),
    path.resolve(cwd, '../../../asset'),
    path.resolve(cwd, '../../../../asset'),
  ]));
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
