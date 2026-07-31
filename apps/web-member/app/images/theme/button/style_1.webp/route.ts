const buttonTexture = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96" preserveAspectRatio="none">
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="0.48" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.18" />
    </linearGradient>
  </defs>
  <rect width="320" height="96" rx="18" fill="url(#surface)" />
  <rect x="1" y="1" width="318" height="94" rx="17" fill="none" stroke="#ffffff" stroke-opacity="0.16" />
</svg>`;

export const dynamic = 'force-static';

export function GET() {
  return new Response(buttonTexture, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
