import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const diagnostics = {
    service: 'web-member',
    version: process.env.APP_VERSION ?? '0.1.0',
    commit: process.env.GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown',
    environment: process.env.NODE_ENV ?? 'development',
    builtAt: process.env.BUILT_AT ?? 'unknown',
    checkedAt: new Date().toISOString(),
  };

  const rows = Object.entries(diagnostics)
    .map(([label, value]) => `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Web Member Diagnostics</title>
  <style>
    :root { color-scheme: dark; background: #0b0810; color: #f7f3ff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    * { box-sizing: border-box; }
    body { min-height: 100dvh; margin: 0; padding: 32px 20px; background: #0b0810; }
    main { width: min(760px, 100%); margin: 0 auto; padding: 24px; border: 1px solid rgba(166,118,255,.34); border-radius: 8px; background: #15111d; box-shadow: 0 18px 50px rgba(0,0,0,.34); }
    h1 { margin: 0 0 20px; font-size: 24px; }
    dl { display: grid; gap: 12px; margin: 0; }
    .row { display: grid; grid-template-columns: minmax(120px,.4fr) minmax(0,1fr); gap: 18px; }
    dt { color: #b9abc9; }
    dd { margin: 0; overflow-wrap: anywhere; }
    p { margin: 22px 0 0; color: #8f829e; font-family: system-ui,sans-serif; font-size: 13px; }
    @media (max-width: 520px) { body { padding: 18px 12px; } main { padding: 18px; } .row { grid-template-columns: 1fr; gap: 4px; } }
  </style>
</head>
<body>
  <main data-member-diagnostics="true" data-build-commit="${escapeHtml(diagnostics.commit)}" data-build-time="${escapeHtml(diagnostics.builtAt)}">
    <h1>Web Member Diagnostics</h1>
    <dl>${rows}</dl>
    <p>Production verification must compare this commit with the current main SHA before UI evidence is accepted.</p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
