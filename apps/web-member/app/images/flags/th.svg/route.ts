const thaiFlag = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24">
  <rect width="36" height="24" rx="3" fill="#a51931" />
  <rect y="4" width="36" height="16" fill="#f4f5f8" />
  <rect y="8" width="36" height="8" fill="#2d2a4a" />
</svg>`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(thaiFlag, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
