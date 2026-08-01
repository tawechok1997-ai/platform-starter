export type FishingSourceRow = {
  id: string;
  name: string;
  image: string;
  providerImage: string;
  tags: readonly string[];
};

const FISHING_TAG = '\u0e22\u0e34\u0e07\u0e1b\u0e25\u0e32';

export const FISHING_SOURCE_ROWS = [
  { id: '6016', name: 'Fortune King Jackpot', image: 'https://cdn.zabbet.com/games/1741166271145-aedb0e71-feb3-4fc0-8bdc-93d802aad6af.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/jlfish.png', tags: ['เกมยล็อต', 'เกมสใหม่'] },
  { id: '6099', name: 'Crazy Party', image: 'https://cdn.zabbet.com/games/1743996724945-d7ee46e9-725a-4204-8d49-a09974a821d5.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png', tags: ['เกมยล็อต', 'เกมสใหม่'] },
  { id: '193', name: 'Oneshot Fishing', image: 'https://cdn.zabbet.com/games/vertical/CQ/oneshot_fishing.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/cqfish.png', tags: [FISHING_TAG] },
  { id: '5054', name: 'Fishing Treasure', image: 'https://cdn.zabbet.com/games/1713425309332-8a03e24d-e1ed-4a91-b5da-ff40de7f52b5.png', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/fsfish.png', tags: [FISHING_TAG] },
  { id: '2690', name: 'Ocean Emperor', image: 'https://cdn.zabbet.com/games/1684333496065-b988dfd3-ddef-4287-834c-9b4843de1e54.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/rsgfish.png', tags: [FISHING_TAG] },
  { id: '2552', name: 'ตกปลาดารกะ', image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21008.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachaifish.png', tags: [FISHING_TAG] },
  { id: '2549', name: 'ตกปลามหาเทพ', image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21003.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachaifish.png', tags: [FISHING_TAG] },
  { id: '2551', name: 'ศึกเดือดตกปลา', image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21006.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachaifish.png', tags: [FISHING_TAG] },
  { id: '2550', name: 'ตกปลาเรือสมบัติ', image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21004.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachaifish.png', tags: [FISHING_TAG] },
  { id: '4073', name: 'Chill Fishing', image: 'https://cdn.zabbet.com/games/1697459171078-7bd5c126-34ba-493a-919a-f5d3d7f87851.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygrfish.png', tags: [FISHING_TAG] },
  { id: '4075', name: 'Insect Master', image: 'https://cdn.zabbet.com/games/1697460472114-3f89bfd3-2791-48e0-8867-d18cebf1fa1c.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygrfish.png', tags: [FISHING_TAG] },
  { id: '7510', name: 'Lost Kingdom', image: 'https://cdn.zabbet.com/games/1761033507345-9c813589-d742-44fc-bdaf-482287ecb1fb.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png', tags: ['เกมสใหม่'] },
  { id: '7511', name: 'Tactical Flush', image: 'https://cdn.zabbet.com/games/1761033563444-33346463-8d88-4681-b162-25026222e492.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png', tags: ['เกมสใหม่'] },
  { id: '7127', name: 'Kung Fu Meow', image: 'https://cdn.zabbet.com/games/1752474018535-c2626452-f823-4dce-8282-0117dab41e54.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/acewinfish.png', tags: ['เกมสใหม่'] },
  { id: '7129', name: 'FORTUNE ZOMBIE', image: 'https://cdn.zabbet.com/games/1752474129622-932b2c1d-0497-4878-bb9e-02a456cab9d6.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/jlfish.png', tags: ['เกมสใหม่'] },
  { id: '4129', name: 'Ocean King Jackpot', image: 'https://cdn.zabbet.com/games/1698405911323-cd74cbd7-2a49-4077-9cc7-9d87e035a64e.png', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/jlfish.png', tags: ['เกมสใหม่'] },
  { id: '2679', name: 'Dinosaur Tycoon II', image: 'https://cdn.zabbet.com/games/1682637746669-06e685fc-2939-442d-a6de-986b82d993be.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/jlfish.png', tags: ['เกมสใหม่'] },
  { id: '2876', name: 'Three Kingdoms Of Fishing', image: 'https://cdn.zabbet.com/games/1686804932871-fe6bb3c4-e7ec-4a57-8bae-96089cb4a87f.jpeg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/wmfish.png', tags: ['เกมสใหม่'] },
  { id: '4048', name: 'Zodiac Hunting', image: 'https://cdn.zabbet.com/games/1696500316419-c95c9300-087f-41a3-975b-7a38d56d2181.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png', tags: ['เกมสใหม่'] },
  { id: '4316', name: 'Make a Killing Fishing', image: 'https://cdn.zabbet.com/games/1705570969344-791f4565-0201-4752-8c06-e0bd7db505b2.png', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygrfish.png', tags: ['เกมสใหม่'] },
  { id: '4304', name: 'Dragon Boom', image: 'https://cdn.zabbet.com/games/1704678891483-1766acd5-e22d-4a14-b9d4-7c7e6619e61d.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png', tags: ['เกมสใหม่'] },
  { id: '4313', name: 'Fortune Fishing', image: 'https://cdn.zabbet.com/games/1704871947762-276f8adb-b534-4ee5-bea7-dba0fcaa9e24.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygrfish.png', tags: ['เกมสใหม่'] },
  { id: '4059', name: 'Honor of King', image: 'https://cdn.zabbet.com/games/1697176887116-101a6395-131e-4372-bde4-3d4af56c7fca.jpg', providerImage: 'https://cdn.zabbet.com/providers/set/1_1_badge/wmfish.png', tags: ['เกมสใหม่'] },
] as const satisfies readonly FishingSourceRow[];
