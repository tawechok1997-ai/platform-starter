'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from './source-game-category-page';

const providerRows = [
  ['ygrfish','YGR'],['misoltfish','Miso'],['cqfish','CQ9'],['fachaifish','Fa Chai'],['jlfish','JILI'],
  ['jkgx2fish','Joker'],['rsgfish','RSG'],['sppfish','SimplePlay'],['spgfish','Spadegaming'],['wmfish','WM'],
  ['kagafish','KA Gaming'],['r88fish','Rich88'],['fsfish','FastSpin'],['askfish','AskMeSlot'],['acewinfish','AceWin'],
] as const;
const providers = providerRows.map(([code,name]) => ({ code,name,badge:`https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,card:`https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`,background:`https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,title:`https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,avatar:`https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png` }));

const rows = [
  ['devil-buster','Devil Buster','https://cdn.zabbet.com/games/1687329677649-ad488dc9-496a-4f75-894e-13e8eb7c9ffa.jpg','kagafish'],
  ['undersea-battle','Undersea Battle','https://cdn.zabbet.com/games/1687328908715-7d505e55-0f6e-4626-8b6c-e3219f15fca3.jpg','kagafish'],
  ['poseidons-secret',"Poseidon's Secret",'https://cdn.zabbet.com/games/1687331270474-65379122-f1a8-4b31-8b24-547f9fa8b74e.jpg','kagafish'],
  ['food-coma','Food Coma','https://cdn.zabbet.com/games/1687329726434-b9262626-ee1e-485f-ae44-95e5dff21017.jpg','kagafish'],
  ['hungry-shark','Hungry Shark','https://cdn.zabbet.com/games/1687330479414-4f256c6e-9d59-4c8a-b99c-09fa92371c85.jpg','kagafish'],
  ['magic-witches','Magic Witches','https://cdn.zabbet.com/games/1687330664337-38bb50fa-b93f-4f01-899d-9f8ad04af502.jpg','kagafish'],
  ['happy-food-hunter','Happy Food Hunter','https://cdn.zabbet.com/games/1687330357573-33975430-fc17-4dda-800b-bdcf3d7733cf.jpg','kagafish'],
  ['monster-island','Monster Island','https://cdn.zabbet.com/games/1687330961673-ffb05b9c-b50c-4303-97a9-4469edb3031d.jpg','kagafish'],
  ['world-of-lord-elf-king','World of Lord Elf King','https://cdn.zabbet.com/games/1687328682582-f5a6c9a1-68d8-4d8f-bb38-177a34f75e21.jpg','kagafish'],
  ['fishing-thai','Fishing Thai','https://cdn.zabbet.com/games/1764653943565-441ce693-e2f4-43e5-b462-aa7d03229a6c.jpeg','misoltfish'],
  ['black-tornado','Black Tornado','https://cdn.zabbet.com/games/1764653967188-1dc18103-3d43-4b8f-8b51-025679c59181.jpeg','misoltfish'],
  ['hoan-kiem-lake','Hoàn Kiếm Lake','https://cdn.zabbet.com/games/1764653990771-e7375829-fa31-4b4c-b628-755c3aeb4b15.jpeg','misoltfish'],
  ['duo-fu-fu-wa','Duo Fu Fu Wa','https://cdn.zabbet.com/games/1764654012713-3dae24ea-5f5e-4a0e-aef6-2e879aa58795.jpeg','misoltfish'],
  ['world-cup-mania','World Cup Mania','https://cdn.zabbet.com/games/1764654037814-9fcb411e-7ed1-4782-885a-cde6cc4cf15c.jpeg','misoltfish'],
  ['captain-fishing','Captain Fishing','https://cdn.zabbet.com/games/1697456164426-bdf17104-ee74-44b5-aff0-fb6233bc0424.jpg','ygrfish'],
  ['longya-fishing','LongYa Fishing','https://cdn.zabbet.com/games/1697460569497-044aaa89-46ae-4078-a45b-95e08dea832f.jpg','ygrfish'],
  ['dragon-zuma','Dragon Zuma','https://cdn.zabbet.com/games/1697459222535-03c42ddf-c03f-43c2-80fb-28b4e2ee895d.jpg','ygrfish'],
  ['zumas-honor',"Zuma's Honor",'https://cdn.zabbet.com/games/1697460730285-fbc23cb1-25e4-489d-9ac7-6024737a5e5e.jpg','ygrfish'],
  ['hero-fishing','Hero Fishing','https://cdn.zabbet.com/games/1670595737720-4a51357f-9592-45bc-9223-78b674b217a4.png','cqfish'],
  ['pirates-fishing','Pirates Fishing','https://cdn.zabbet.com/games/1697460601524-afd92a33-4d24-4440-930c-501e1aee35f6.jpg','ygrfish'],
  ['lucky-fishing','Lucky Fishing','https://cdn.zabbet.com/games/vertical/CQ/lucky_fishing.jpg','cqfish'],
] as const;

const config: SourceGameCategoryConfig = {
  slug:'fishing', title:'ยิงปลา', total:129, resultUnit:'เกม', mode:'games',
  baseBackground:'/images/game/fishing/bg_fishing.webp', baseLogo:'/images/game/fishing/logo_fishing.webp',
  filters:[{key:'hot',label:'เกมส์ฮิต',count:9},{key:'new',label:'เกมส์ใหม่',count:14},{key:'slot',label:'เกมส์สล็อต',count:2}],
  providers, showProviderStrip:true,
  games:rows.map(([id,name,image,provider]) => ({id,name,image,provider,isNew:false,isHot:false,tags:[]})),
};

export default function FishingBrowseSource(){ return <SourceGameCategoryPage config={config}/>; }
