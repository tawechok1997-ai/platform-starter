import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Web Member Diagnostics',
  robots: { index: false, follow: false },
};

export default function MemberDiagnosticsPage() {
  const diagnostics = {
    service: 'web-member',
    version: process.env.APP_VERSION ?? '0.1.0',
    commit: process.env.GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown',
    environment: process.env.NODE_ENV ?? 'development',
    builtAt: process.env.BUILT_AT ?? 'unknown',
    checkedAt: new Date().toISOString(),
  };

  return (
    <main
      data-member-diagnostics="true"
      data-build-commit={diagnostics.commit}
      data-build-time={diagnostics.builtAt}
      style={{
        minHeight: '100dvh',
        padding: '32px 20px',
        background: '#0b0810',
        color: '#f7f3ff',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      <section
        aria-labelledby="member-diagnostics-title"
        style={{
          width: 'min(760px, 100%)',
          margin: '0 auto',
          padding: '24px',
          border: '1px solid rgba(166, 118, 255, 0.34)',
          borderRadius: '8px',
          background: '#15111d',
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.34)',
        }}
      >
        <h1 id="member-diagnostics-title" style={{ margin: '0 0 20px', fontSize: '24px' }}>
          Web Member Diagnostics
        </h1>
        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.4fr) minmax(0, 1fr)', gap: '12px 18px', margin: 0 }}>
          {Object.entries(diagnostics).map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt style={{ color: '#b9abc9' }}>{label}</dt>
              <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{value}</dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: '22px 0 0', color: '#8f829e', fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
          Production verification must compare this commit with the current main SHA before UI evidence is accepted.
        </p>
      </section>
    </main>
  );
}
