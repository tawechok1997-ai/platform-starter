const CDN_ROOT = 'https://cdn.zabbet.com/FEZX';

export const MOBILE_SOURCE_ASSETS = {
  headerLogo: `${CDN_ROOT}/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png`,
  tournamentBanner: 'https://cdn.zabbet.com/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png',
  shortcutBackground: `${CDN_ROOT}/lobby_settings/fc6b7ea8-3eaf-47ec-8640-33c7138d3c7c.png`,
  shortcutIcon: `${CDN_ROOT}/lobby_settings/083e4b9b-63aa-4825-a0e3-57a88de57e2f.ico`,
  promotionSlides: [
    `${CDN_ROOT}/imageslides/1784894399570-2ba3393c-2988-4971-834b-86bbe275d0bb.jpg`,
    `${CDN_ROOT}/imageslides/1784894972162-da9eaece-7402-4bb6-813f-7a83dc2925c2.jpg`,
    `${CDN_ROOT}/imageslides/1784895027990-67f1beb1-8c13-4582-b6ff-dbb647773c9a.jpg`,
    `${CDN_ROOT}/imageslides/1784895081838-4f8ccf22-9b17-4157-900f-0b78f883d69d.jpg`,
    `${CDN_ROOT}/imageslides/1784895118089-b5159a76-a1b4-491e-81d0-e0d3f27d3818.jpg`,
    `${CDN_ROOT}/imageslides/1784470530271-94bf2de8-a759-4e02-8af9-bbd08a398208.jpg`,
    `${CDN_ROOT}/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    `${CDN_ROOT}/imageslides/1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77.jpg`,
    `${CDN_ROOT}/imageslides/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg`,
    `${CDN_ROOT}/imageslides/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg`,
  ],
} as const;

export function sourceAssetFileName(value: string | undefined) {
  if (!value) return '';
  const clean = value.split(/[?#]/, 1)[0] ?? '';
  return clean.slice(clean.lastIndexOf('/') + 1).toLowerCase();
}

export function isSameSourceAsset(left: string | undefined, right: string | undefined) {
  const leftName = sourceAssetFileName(left);
  const rightName = sourceAssetFileName(right);
  return Boolean(leftName && rightName && leftName === rightName);
}
