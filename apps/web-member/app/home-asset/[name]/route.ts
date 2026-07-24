import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'fish.png',
  'slot.png',
  'casino.png',
  'live.png',
  'loto.png',
  'card.png',
  'sport.png',
  'logo.png',
]);

const SOURCE_NAMES: Record<string, string[]> = {
  'logo.png': [
    '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7(1).png',
    '9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png',
    'logo.png',
  ],
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
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

async function resolveAsset(publicName: string) {
  if (cache.has(publicName)) return cache.get(publicName) ?? null;

  const targets = SOURCE_NAMES[publicName] ?? [publicName];
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
