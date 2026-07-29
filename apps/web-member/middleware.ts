import { NextRequest, NextResponse } from 'next/server';

const GAME_FALLBACK_FILENAMES = new Set([
  'elpaso0000000000.jpg',
  'sweet_bonanza_xmas.png',
  'thai_hi_lo_2.jpg',
  'starlight_princess.png',
  'coin_spinner.jpg',
  'alice-run.jpg',
  'el-paso.jpg',
  'blackjack.jpg',
  'thai_fish_prawn_crab.jpg',
  'punto_banco.png',
]);

const TRANSPARENT_FILENAMES = new Set([
  'logo-noah345.png',
  'icongamehit.webp',
  'live1.webp',
  'cq9.png',
  'provider-25.png',
]);

const TRANSPARENT_PATHS = new Set([
  '/assets/asset-pc/images/providers/cdn.zabbet.com/providers/set/1_1_avatar/kingm.png',
  '/assets/asset-pc/images/providers/nolimit-city.png',
  '/assets/asset-pc/images/providers/set/1_1_badge/provider-8.png',
  '/assets/asset-pc/images/providers/cdn.zabbet.com/providers/set/1_1_avatar/amb.png',
  '/assets/asset-pc/images/providers/set/1_1_badge/provider-57.png',
  '/assets/asset-pc/images/providers/set/1_1_badge/provider-24.png',
  '/assets/asset-pc/images/providers/set/1_1_badge/provider-38.png',
]);

const TRANSPARENT_FALLBACK = '/images/fallbacks/transparent.svg';
const GAME_FALLBACK = '/images/fallbacks/noah345-placeholder.svg';

export function middleware(request: NextRequest) {
  const pathname = decodeURIComponent(request.nextUrl.pathname);
  const lowerPath = pathname.toLowerCase();

  if (lowerPath === TRANSPARENT_FALLBACK || lowerPath === GAME_FALLBACK) {
    return NextResponse.next();
  }

  const filename = lowerPath.split('/').filter(Boolean).pop() ?? '';

  if (TRANSPARENT_PATHS.has(lowerPath) || TRANSPARENT_FILENAMES.has(filename)) {
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = TRANSPARENT_FALLBACK;
    fallbackUrl.search = '';
    return NextResponse.rewrite(fallbackUrl);
  }

  if (GAME_FALLBACK_FILENAMES.has(filename)) {
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = GAME_FALLBACK;
    fallbackUrl.search = '';
    return NextResponse.rewrite(fallbackUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
