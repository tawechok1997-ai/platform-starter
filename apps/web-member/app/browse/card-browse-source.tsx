'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from './source-game-category-page';

const badge = 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png';
const rows = [
  ['burmese-6-animals','Burmese 6 Animals','https://cdn.zabbet.com/games/1762491448874-7fcaf6e3-1b1c-4e81-a3ca-9f4ebeb6c5b5.png',true,false],
  ['hunk-cai-shen','Hunk Cai Shen','https://cdn.zabbet.com/games/1762491483123-8f8674b7-bbbf-4d96-8ea1-cf134f0abfa2.png',true,false],
  ['dear-senpai','Dear Senpai','https://cdn.zabbet.com/games/1762491587805-9b47d8a1-5f56-4aeb-82b6-b43ebfc6fa17.png',true,false],
  ['speedy-andar-bahar','Speedy Andar Bahar','https://cdn.zabbet.com/games/1762491531292-03189bfe-5299-450c-a7d9-f0b712f1cd21.png',true,false],
  ['mahjong-beauty','Mahjong Beauty','https://cdn.zabbet.com/games/1762769398184-e0ba7c5e-7624-4f5a-a292-da7cf4d19371.png',true,false],
  ['samba-rhapsody','Samba Rhapsody','https://cdn.zabbet.com/games/1762769441287-b80b505d-3ea9-481a-a39e-c0b7f4782017.png',true,false],
  ['lucky-cat-gala','Lucky Cat Gala','https://cdn.zabbet.com/games/1762769473201-6724712a-eff8-4c39-9c48-7c61dd4f139a.png',true,false],
  ['bai-cao-mystic-four','Bai Cao Mystic Four','https://cdn.zabbet.com/games/1762769508631-208094ee-1009-4012-807c-855c9574e7d5.png',true,false],
  ['teen-patti-versus','Teen Patti Versus','https://cdn.zabbet.com/games/1762769550040-405a633c-9c6c-4366-b59d-45597c9a96fd.png',true,false],
  ['vietnam-rock-paper-scissors','Vietnam Rock Paper Scissors','https://cdn.zabbet.com/games/1762769584860-3d843a64-2af6-4fd4-ab94-74a79512c194.png',true,false],
  ['thai-hi-lo-2','ไฮโลไทย 2','https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg',false,true],
  ['vietnam-fish-prawn-crab','เวียดนามน้ำเต้าปูปลา','https://cdn.zabbet.com/games/KM/TH/Thai_Fish_Prawn_Crab.jpg',false,true],
  ['fish-prawn-crab-2','น้ำเต้าปูปลา 2','https://cdn.zabbet.com/games/KM/TH/Fish_Prawn_Crab_2.jpg',false,true],
  ['tai-xiu','ไฮโลเวียดนาม','https://cdn.zabbet.com/games/KM/TH/Tai_Xiu.jpg',false,false],
  ['sic-bo','Sic Bo','https://cdn.zabbet.com/games/KM/TH/Sicbo.jpg',false,false],
  ['poker-roulette','รูเล็ต โป๊กเกอร์','https://cdn.zabbet.com/games/KM/TH/Poker_Roulette.jpg',false,false],
  ['7-up-7-down','7 สูง 7 ต่ำ','https://cdn.zabbet.com/games/KM/TH/7_Up_7_Down.jpg',false,true],
  ['baccarat','บาคาร่า','https://cdn.zabbet.com/games/KM/TH/Baccarat.jpg',false,true],
] as const;

const config: SourceGameCategoryConfig = {
  slug:'card', title:'ไพ่', total:123, resultUnit:'เกม', mode:'games',
  baseBackground:'/images/game/card/bg_card.webp', baseLogo:'/images/game/card/logo_card.webp',
  filters:[], providers:[], showProviderStrip:true,
  games: rows.map(([id,name,image,isNew,isHot]) => ({ id,name,image,provider:null,providerBadge:badge,isNew,isHot,tags:[...(isNew?['new' as const]:[]),...(isHot?['hot' as const]:[])] })),
};

export default function CardBrowseSource(){ return <SourceGameCategoryPage config={config}/>; }
