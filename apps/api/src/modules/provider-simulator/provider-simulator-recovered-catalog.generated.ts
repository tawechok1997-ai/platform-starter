import { RECOVERED_GAME_CATALOG_PART_01 } from './provider-simulator-recovered-catalog-part-01.generated';
import { RECOVERED_GAME_CATALOG_PART_02 } from './provider-simulator-recovered-catalog-part-02.generated';
import { RECOVERED_GAME_CATALOG_PART_03 } from './provider-simulator-recovered-catalog-part-03.generated';
import { RECOVERED_GAME_CATALOG_PART_04 } from './provider-simulator-recovered-catalog-part-04.generated';
import { RECOVERED_GAME_CATALOG_PART_05 } from './provider-simulator-recovered-catalog-part-05.generated';
import { RECOVERED_GAME_CATALOG_PART_06 } from './provider-simulator-recovered-catalog-part-06.generated';
import { RECOVERED_GAME_CATALOG_PART_07 } from './provider-simulator-recovered-catalog-part-07.generated';
import { RECOVERED_GAME_CATALOG_PART_08 } from './provider-simulator-recovered-catalog-part-08.generated';
import { RECOVERED_GAME_CATALOG_PART_09 } from './provider-simulator-recovered-catalog-part-09.generated';
import { RECOVERED_GAME_CATALOG_PART_10 } from './provider-simulator-recovered-catalog-part-10.generated';

// 394 recovered records overlay the historical catalog: 195 slot, 106 card, 93 fishing.
export const RECOVERED_GAME_CATALOG_OVERLAY = [
  ...RECOVERED_GAME_CATALOG_PART_01,
  ...RECOVERED_GAME_CATALOG_PART_02,
  ...RECOVERED_GAME_CATALOG_PART_03,
  ...RECOVERED_GAME_CATALOG_PART_04,
  ...RECOVERED_GAME_CATALOG_PART_05,
  ...RECOVERED_GAME_CATALOG_PART_06,
  ...RECOVERED_GAME_CATALOG_PART_07,
  ...RECOVERED_GAME_CATALOG_PART_08,
  ...RECOVERED_GAME_CATALOG_PART_09,
  ...RECOVERED_GAME_CATALOG_PART_10,
] as const;
