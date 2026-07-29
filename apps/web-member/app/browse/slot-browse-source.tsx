'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from './source-game-category-page';

const providerCodes = ['ygr','hotdog','misolt','jl','pp','kingm','spg','jkgx2','fachai','rsg','pgsoft','kaga','hacksaw','cq','redtiger','hbn','wmslot','evp','netent','ps','pokslot','edp','spp','ame','bng','r88','cala','glx','l22','reg','ygg','fs','pgsus','n2','ap','amb','ask','nlc','vp','drag','acewin','rb7slot'] as const;

const providers = providerCodes.map((code) => ({
  code,
  name: code.toUpperCase(),
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
  card: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png`,
  maintenance: code === 'l22',
}));

const rows = [
  ['island-ices','Island Ices','https://cdn.zabbet.com/games/1771481576088-7a598c5e-dbe1-441a-a3e0-c9aba0ede728.png','ygg'],
  ['covert-chaos','Covert Chaos','https://cdn.zabbet.com/games/1771481607415-fd863209-0afc-434f-92bd-7b7a07b13a0b.png','ygg'],
  ['caishen-win','Caishen Win!','https://cdn.zabbet.com/games/1776497353110-1181f568-fdd2-450d-a812-faa308cb334b.png','hotdog'],
  ['bank-of-blarney','Bank of Blarney TopHit','https://cdn.zabbet.com/games/1771481638873-510e7420-776d-46e7-8775-9a6da3a789e3.png','ygg'],
  ['gemlight','Gemlight','https://cdn.zabbet.com/games/1776497396303-bff28301-5881-4af1-aa78-845c4f984cf6.png','hotdog'],
  ['headhunter','Headhunter','https://cdn.zabbet.com/games/1771481670384-4f382321-ddc1-416e-ab18-c16baaa2ef5d.png','ygg'],
  ['gemlight-2','Gemlight 2','https://cdn.zabbet.com/games/1776497423817-ee29d60f-ff9b-432e-8e86-e54b669399e0.png','hotdog'],
  ['raptor-2','Raptor 2','https://cdn.zabbet.com/games/1771481701809-48d1a1f8-4fa2-4f77-808d-b4188431e5f7.png','ygg'],
  ['ras-golden-sun','Ra’s Golden Sun','https://cdn.zabbet.com/games/1776497448378-9121c619-b8f3-4de6-b8b5-8477efc106b2.png','hotdog'],
  ['fortune-meow','Fortune Meow','https://cdn.zabbet.com/games/1776497472870-19722634-fa3c-489a-9924-3064affadd57.png','hotdog'],
  ['majestic-gems','Majestic Gems','https://cdn.zabbet.com/games/1776752663263-54083e3d-95e5-4d62-8a9b-37b590a965b1.png','hotdog'],
  ['super-ace','Super Ace','https://cdn.zabbet.com/games/1776752691156-e36b7cd1-61b7-4a78-aacf-0c40bdb503f9.png','hotdog'],
  ['roma-x','Roma X','https://cdn.zabbet.com/games/1776752719475-27cbcef6-51b7-460d-91a7-6a285dfcb42b.png','hotdog'],
  ['wild-bandito','Wild Bandito','https://cdn.zabbet.com/games/1776752746675-a2918580-5a7c-457d-a27f-0a23106281d8.png','hotdog'],
  ['funky-fortunez','Funky Fortunez','https://cdn.zabbet.com/games/1777960364860-5737aa5a-9dba-4a0b-bc37-5d9339d98dd7.png','pgsoft'],
  ['3-lucky-baozhu','3 Lucky Baozhu','https://cdn.zabbet.com/games/1771831180127-737a7746-6875-4b0e-8e51-f53ab73ac199.png','jl'],
  ['stamp-world','Stamp World','https://cdn.zabbet.com/games/1760684115397-a48f34c0-9bc0-4029-8583-47c8bfd19bbe.jpeg','kaga'],
  ['3-coin-wild-tiger','3 Coin Wild Tiger','https://cdn.zabbet.com/games/1771831212100-d9591cd2-01ad-4fa5-97cb-0d053654b288.png','jl'],
  ['barbarian-giants','Barbarian Giants Fusion Reels','https://cdn.zabbet.com/games/1760684316995-98d85713-1e24-426f-85a0-dcc8b5bfbb12.jpeg','kaga'],
  ['amar-akbar-anthony','Amar Akbar Anthony','https://cdn.zabbet.com/games/1771831242933-7ebb9a9e-30b1-4447-bcb3-dc5ae4bd4674.png','jl'],
  ['chaos-combat','Chaos Combat Buy Feature','https://cdn.zabbet.com/games/1760684336675-aaba7607-8d0b-4bc5-a9be-9684f1180381.jpeg','kaga'],
  ['muscle-fortune-cat','MUSCLE FORTUNE CAT','https://cdn.zabbet.com/games/1772000800361-6f87dbc3-c3ea-4035-8850-21d262c1baf4.png','fachai'],
  ['way-to-fortune','Way To Fortune','https://cdn.zabbet.com/games/1778467079537-0d997cac-0a55-4c36-aeb6-609dd1cff317.png','hotdog'],
  ['stardom-rush','Stardom Rush','https://cdn.zabbet.com/games/1760684359146-50690815-fe25-4b24-af37-4e7e5666867b.jpeg','kaga'],
  ['bad-rich-wolf','BAD RICH WOLF','https://cdn.zabbet.com/games/1772000828991-cfb4e340-cf85-41b4-9457-650c0be60a01.png','fachai'],
  ['money-tree','Money Tree','https://cdn.zabbet.com/games/1778467190766-eb787ab3-e567-47f2-b960-cd62d613019e.png','hotdog'],
  ['zombie-siege','Zombie Siege','https://cdn.zabbet.com/games/1760684410910-ef5e92ce-c355-4f1b-a917-0a3dbc3f5045.jpeg','kaga'],
  ['dj-boom-boom','DJ BOOM BOOM','https://cdn.zabbet.com/games/1772000872057-64f180bd-16b8-4149-ae43-0511291306eb.png','fachai'],
  ['skeleton-party','Skeleton Party','https://cdn.zabbet.com/games/1760684429408-364219f6-1d13-409c-aa2b-f8057489b814.jpeg','kaga'],
  ['open-vault','OPEN VAULT','https://cdn.zabbet.com/games/1772000901348-d072824c-0d9c-4264-b3cd-dde19fe5ce44.png','fachai'],
] as const;

const config: SourceGameCategoryConfig = {
  slug: 'slot',
  title: 'สล็อต',
  total: 5094,
  resultUnit: 'เกม',
  mode: 'games',
  baseBackground: '/assets/asset-pc/images/game/slot/bg_slot.webp',
  baseLogo: '/assets/asset-pc/images/game/slot/logo_slot.webp',
  filters: [
    { key: 'arcade', label: 'เกมส์อาเขต', count: 182 },
    { key: 'buy', label: 'ซื้อฟรีสปิน', count: 900 },
    { key: 'hot', label: 'เกมส์ฮิต', count: 546 },
    { key: 'new', label: 'เกมส์ใหม่', count: 552 },
    { key: 'slot', label: 'เกมส์สล็อต', count: 3694 },
    { key: 'table', label: 'เกมส์โต๊ะ', count: 233 },
  ],
  providers,
  showProviderStrip: true,
  showAllProviders: true,
  games: rows.map(([id, name, image, provider]) => ({
    id,
    name,
    image,
    provider,
    isNew: true,
    isHot: false,
    tags: ['new' as const, 'slot' as const],
  })),
};

export default function SlotBrowseSource() {
  return <SourceGameCategoryPage config={config} />;
}
