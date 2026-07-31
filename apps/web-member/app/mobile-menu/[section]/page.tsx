import { notFound } from 'next/navigation';
import MobileReferencePage, {
  type MobileReferenceSection,
} from '../../components/mobile-reference/mobile-reference-page';
import { resolveExactAsset } from '../../components/mobile-reference/resolve-exact-asset';

const SECTIONS = new Set<MobileReferenceSection>([
  'vip',
  'live',
  'promotions',
  'news',
  'activities',
  'video',
  'guide',
  'language',
]);

const SOURCES: Record<string, string> = {
  vipBronze: 'https://cdn.zabbet.com/FEZX/grouptypes/c005cd08-59f6-485f-8ee2-db342d509aa5.png',
  vipSilver: 'https://cdn.zabbet.com/FEZX/grouptypes/36eb82e4-63aa-49ac-aa07-b075b0e91ca4.png',
  promotionTurnover: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
  promotionReferral: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
  promotionDeposit: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
  activityMission: 'https://cdn.zabbet.com/event/predict/1780247611927-ae560ced-7558-4f96-b07a-c77e1f92b031.jpeg',
  activityLottery: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
  activityTurnover: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  team683: 'https://googlecdn.live/teams/683.png',
  team681: 'https://googlecdn.live/teams/681.png',
  team7031: 'https://googlecdn.live/teams/7031.png',
  team7064: 'https://googlecdn.live/teams/7064.png',
  team100: 'https://googlecdn.live/teams/100.png',
  team102: 'https://googlecdn.live/teams/102.png',
  team324: 'https://googlecdn.live/teams/324.png',
  team304: 'https://googlecdn.live/teams/304.png',
  team466: 'https://googlecdn.live/teams/466.png',
  team21661: 'https://googlecdn.live/teams/21661.png',
  team2303: 'https://googlecdn.live/teams/2303.png',
  team469: 'https://googlecdn.live/teams/469.png',
  team2836: 'https://googlecdn.live/teams/2836.png',
  team95: 'https://googlecdn.live/teams/95.png',
  team1497: 'https://googlecdn.live/teams/1497.png',
  team1094: 'https://googlecdn.live/teams/1094.png',
  flagEn: '/images/flags/en.svg',
  flagTh: '/images/flags/th.svg',
  flagPh: '/images/flags/ph.svg',
  flagVi: '/images/flags/vi.svg',
  flagKm: '/images/flags/km.svg',
  flagLo: '/images/flags/lo.svg',
  flagId: '/images/flags/id.svg',
  flagMm: '/images/flags/mm.svg',
};

type MobileMenuSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function MobileMenuSectionPage({ params }: MobileMenuSectionPageProps) {
  const { section } = await params;
  if (!SECTIONS.has(section as MobileReferenceSection)) notFound();

  const assets = Object.fromEntries(
    Object.entries(SOURCES).map(([key, source]) => [key, resolveExactAsset(source)]),
  );

  return (
    <MobileReferencePage
      section={section as MobileReferenceSection}
      assets={assets}
    />
  );
}
