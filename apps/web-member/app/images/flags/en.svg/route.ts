const englishFlag = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24">
  <rect width="36" height="24" rx="3" fill="#012169" />
  <path d="M0 0 36 24M36 0 0 24" stroke="#fff" stroke-width="5" />
  <path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" stroke-width="2" />
  <path d="M18 0v24M0 12h36" stroke="#fff" stroke-width="8" />
  <path d="M18 0v24M0 12h36" stroke="#c8102e" stroke-width="4" />
</svg>`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(englishFlag, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
