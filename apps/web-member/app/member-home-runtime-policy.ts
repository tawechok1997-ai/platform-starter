import type { TypedPublicSiteSettings } from './site-settings-types';
import type { MemberHomeDataRuntime } from './member-home-data-runtime';
import type {
  MemberHomeContentRuntime,
  MemberLeaderboardEntry,
  MemberQuickActionRuntime,
} from './member-runtime-contract';
import { V47_ASSETS } from './components/member-home/v47-asset-map';

const DEFAULT_QUICK_ACTION_COPY = [
  { title: 'โปรโมชั่นพิเศษ', summary: 'โปรโมชั่นพิเศษเฉพาะคุณ' },
  { title: 'กิจกรรม', summary: 'กิจกรรมตลอด 24 ชั่วโมง' },
  { title: 'ข่าวสาร', summary: 'ข่าวสารที่คุณไม่ควรพลาด' },
] as const;

const DEFAULT_LEADERBOARD: MemberLeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Golden Empire',
    user: '092XXXX986',
    amount: '฿1,995',
    image: '/assets/asset-pc/images/games/1670596360948-8b1915ee-c2d6-4fb0-b22c-0c7fb32b0117.png',
  },
  {
    rank: 2,
    name: 'Maya Golden City',
    user: '093XXXX510',
    amount: '฿1,200',
    image: '/assets/asset-pc/images/games/1667928508204-7c69c936-becb-4ed3-9371-6ddb13bf9202.png',
  },
  {
    rank: 3,
    name: 'Fortune Rabbit',
    user: '064XXXX667',
    amount: '฿809',
    image: '/assets/asset-pc/images/games/1671503437258-6858b67e-74b0-4f92-a2c1-0baa9b8ce8a5.png',
  },
  {
    rank: 4,
    name: 'Fortune Gems',
    user: '081XXXX589',
    amount: '฿640',
    image: '/assets/asset-pc/images/games/1670762884919-364a6e35-5fe4-41f9-8ce7-892e9e2ac9b6.png',
  },
  {
    rank: 5,
    name: 'Caishen Wins',
    user: '096XXXX449',
    amount: '฿560',
    image: '/assets/asset-pc/images/games/1667451216350-67ca671b-fac7-444c-9dff-c09d9524ee0e.png',
  },
];

export function applyMemberHomeContentPolicy(
  settings: TypedPublicSiteSettings,
  home: MemberHomeContentRuntime,
): MemberHomeContentRuntime {
  const features = settings.features as Record<string, unknown>;
  const quickActions = home.quickActions.map((item, index) => normalizeQuickAction(features, item, index));
  const configuredJackpotImage = text(features.jackpot_image_url);
  const presentationJackpotImage = findPresentationJackpot(settings);
  const runtimeJackpotImage = isJackpotPresentationImage(home.jackpot.image) ? home.jackpot.image : '';

  return {
    ...home,
    quickActions,
    jackpot: {
      ...home.jackpot,
      title: text(features.jackpot_title) || 'Jackpot',
      subtitle: text(features.jackpot_subtitle) || 'Epic of the day',
      image: firstUsableJackpotImage(
        configuredJackpotImage,
        presentationJackpotImage,
        runtimeJackpotImage,
        V47_ASSETS.jackpot,
      ),
    },
  };
}

export function applyMemberHomeDataPolicy(
  settings: TypedPublicSiteSettings,
  data: MemberHomeDataRuntime,
): MemberHomeDataRuntime {
  const features = settings.features as Record<string, unknown>;
  const configuredLimit = finiteInteger(features.leaderboard_limit, 5);
  const limit = Math.min(10, Math.max(1, configuredLimit));
  const leaderboard = fillLeaderboard(data.leaderboard, limit);

  return {
    ...data,
    leaderboard,
  };
}

function normalizeQuickAction(
  features: Record<string, unknown>,
  item: MemberQuickActionRuntime,
  index: number,
): MemberQuickActionRuntime {
  const defaults = DEFAULT_QUICK_ACTION_COPY[index] ?? {
    title: item.title,
    summary: item.summary,
  };
  const prefix = index === 0 ? 'quick_promotion' : index === 1 ? 'quick_activity' : 'quick_news';

  return {
    ...item,
    title: text(features[`${prefix}_title`]) || defaults.title,
    summary: text(features[`${prefix}_summary`]) || defaults.summary,
  };
}

function fillLeaderboard(entries: MemberLeaderboardEntry[], limit: number) {
  const source = Array.isArray(entries) ? entries : [];
  const result: MemberLeaderboardEntry[] = [];

  for (let index = 0; index < limit; index += 1) {
    const configured = source[index];
    const fallback = DEFAULT_LEADERBOARD[index % DEFAULT_LEADERBOARD.length]!;
    result.push({
      rank: index + 1,
      name: text(configured?.name) || fallback.name,
      user: text(configured?.user) || fallback.user,
      amount: text(configured?.amount) || fallback.amount,
      image: text(configured?.image) || fallback.image,
    });
  }

  return result;
}

function findPresentationJackpot(settings: TypedPublicSiteSettings) {
  const assets = settings.features.cms_content?.assets;
  if (!Array.isArray(assets)) return '';

  const exact = assets.find((asset) => asset?.enabled !== false && asset?.id === 'member.presentation.jackpot');
  if (exact?.url) return exact.url;

  const tagged = assets.find((asset) => {
    if (!asset || asset.enabled === false || !asset.url) return false;
    const haystack = `${asset.id} ${asset.name} ${asset.tag ?? ''}`.toLowerCase();
    return haystack.includes('presentation') && haystack.includes('jackpot');
  });
  return tagged?.url ?? '';
}

function firstUsableJackpotImage(...values: string[]) {
  return values.find(isJackpotPresentationImage) ?? V47_ASSETS.jackpot;
}

function isJackpotPresentationImage(value: string) {
  const normalized = text(value).toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('/home/coin.') || normalized.includes('iconjackpot')) return false;
  if (normalized.includes('/ui/') || normalized.includes('/menu/')) return false;
  return /\.(?:gif|webp|png|jpe?g)(?:[?#].*)?$/.test(normalized);
}

function finiteInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
