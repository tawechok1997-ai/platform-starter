const ASSET_REDIRECTS: Readonly<Record<string, string>> = {
  'fire.svg': '/assets/asset-pc/images/game/fire.webp',
  'mostonline.svg': '/assets/asset-pc/images/home/mostonline1.webp',
  'live.svg': '/assets/reference-brand/menu/live.png',
  'faq.svg': '/assets/asset-moblie/images/home/faq.svg',
};

export function GET(request: Request) {
  const asset = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
  const destination = ASSET_REDIRECTS[asset];

  if (!destination) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 307,
    headers: {
      Location: destination,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
