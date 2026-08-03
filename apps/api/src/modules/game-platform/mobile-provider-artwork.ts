const SOURCE_CDN = 'https://cdn.zabbet.com';

type MobileProviderCategory = 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const MOBILE_PROVIDER_CARD_PATHS: Readonly<Record<MobileProviderCategory, Readonly<Record<string, string>>>> = {
  casino: {
    dg: '/providers/set/1_1_h/dg.png',
    sexyd: '/providers/set/1_1_l/sexyd.png',
    yeebet: '/providers/set/1_1_h/yeebet.png',
    sag: '/providers/set/1_1_h/sag.png',
    ppcasino: '/providers/set/1_1_h/ppcasino.png',
    evt: '/providers/set/1_1_h/evt.png',
    ab: '/providers/set/1_1_h/ab.png',
    wmc: '/providers/set/1_1_h/wmc.png',
    biggamecasino: '/providers/set/1_1_h/biggamecasino.png',
    astar: '/providers/set/1_1_h/astar.png',
  },
  slot: {
    'simulator-provider': '/assets/demo-slot/simulator-provider-card.svg',
    ygr: '/providers/set/1_1_h/ygr.png',
    hotdog: '/providers/set/1_1_l/hotdog.png',
    misolt: '/providers/set/1_1_h/misolt.png',
    jl: '/providers/set/1_1_h/jl.png',
    pp: '/providers/set/1_1_h/pp.png',
    kingm: '/providers/set/1_1_h/kingm.png',
    spg: '/providers/set/1_1_h/spg.png',
    jkgx2: '/providers/set/1_1_h/jkgx2.png',
    fachai: '/providers/set/1_1_h/fachai.png',
    rsg: '/providers/set/1_1_h/rsg.png',
    pgsoft: '/providers/set/1_1_h/pgsoft.png',
    kaga: '/providers/set/1_1_h/kaga.png',
    hacksaw: '/providers/set/1_1_h/hacksaw.png',
    cq: '/providers/set/1_1_h/cq.png',
    redtiger: '/providers/set/1_1_h/redtiger.png',
    hbn: '/providers/set/1_1_h/hbn.png',
    wmslot: '/providers/set/1_1_h/wmslot.png',
    evp: '/providers/set/1_1_h/evp.png',
    netent: '/providers/set/1_1_h/netent.png',
    ps: '/providers/set/1_1_h/ps.png',
    pokslot: '/providers/set/1_1_h/pokslot.png',
    edp: '/providers/set/1_1_h/edp.png',
    spp: '/providers/set/1_1_h/spp.png',
    ame: '/providers/set/1_1_h/ame.png',
    bng: '/providers/set/1_1_h/bng.png',
    r88: '/providers/set/1_1_h/r88.png',
    cala: '/providers/set/1_1_h/cala.png',
    glx: '/providers/set/1_1_h/glx.png',
    l22: '/providers/set/1_1_h/l22.png',
    reg: '/providers/set/1_1_h/reg.png',
    ygg: '/providers/set/1_1_h/ygg.png',
    fs: '/providers/set/1_1_h/fs.png',
    pgsus: '/providers/set/1_1_h/pgsus.png',
    n2: '/providers/set/1_1_h/n2.png',
    ap: '/providers/set/1_1_h/ap.png',
    amb: '/providers/set/1_1_h/amb.png',
    ask: '/providers/set/1_1_h/ask.png',
    nlc: '/providers/set/1_1_h/nlc.png',
    vp: '/providers/set/1_1_h/vp.png',
    drag: '/providers/set/1_1_h/drag.png',
    acewin: '/providers/set/1_1_h/acewin.png',
    rb7slot: '/providers/set/1_1_h/rb7slot.png',
  },
  fishing: {
    ygrfish: '/providers/set/1_1_h/ygrfish.png',
    misoltfish: '/providers/set/1_1_l/misoltfish.png',
    cqfish: '/providers/set/1_1_h/cqfish.png',
    fachaifish: '/providers/set/1_1_h/fachaifish.png',
    jlfish: '/providers/set/1_1_h/jlfish.png',
    jkgx2fish: '/providers/set/1_1_h/jkgx2fish.png',
    rsgfish: '/providers/set/1_1_h/rsgfish.png',
    sppfish: '/providers/set/1_1_h/sppfish.png',
    spgfish: '/providers/set/1_1_h/spgfish.png',
    wmfish: '/providers/set/1_1_h/wmfish.png',
    kagafish: '/providers/set/1_1_h/kagafish.png',
    r88fish: '/providers/set/1_1_h/r88fish.png',
    fsfish: '/providers/set/1_1_h/fsfish.png',
    askfish: '/providers/set/1_1_h/askfish.png',
    acewinfish: '/providers/set/1_1_h/acewinfish.png',
  },
  sport: {
    sbo: '/providers/set/1_1_h/sbo.png',
    lali: '/providers/set/1_1_l/lali.png',
    bcs: '/providers/set/1_1_h/bcs.png',
    muay: '/providers/set/1_1_h/muay.png',
    saba: '/providers/set/1_1_h/saba.png',
  },
  card: {
    kingm: '/providers/set/1_1_h/kingm.png',
    amb: '/providers/set/1_1_l/amb.png',
  },
  lottery: {
    lotmw: '/providers/set/1_1_h/lotmw.png',
    dac: '/providers/set/1_1_h/dac.png',
  },
};

export function mobileProviderCardUrl(category: string, providerCode: string) {
  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) return '';
  const normalizedProvider = normalizeProviderCode(providerCode);
  const path = MOBILE_PROVIDER_CARD_PATHS[normalizedCategory][normalizedProvider];
  if (!path) return '';
  return /^https?:\/\//i.test(path) || path.startsWith('/assets/') ? path : `${SOURCE_CDN}${path}`;
}

export function mobileProviderArtworkCount() {
  return Object.values(MOBILE_PROVIDER_CARD_PATHS)
    .reduce((total, providers) => total + Object.keys(providers).length, 0);
}

function normalizeCategory(value: string): MobileProviderCategory | null {
  const category = value.trim().toLowerCase();
  if (category === 'live') return 'casino';
  if (category === 'arcade') return 'slot';
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  if (
    category === 'casino'
    || category === 'slot'
    || category === 'fishing'
    || category === 'sport'
    || category === 'card'
    || category === 'lottery'
  ) return category;
  return null;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}
