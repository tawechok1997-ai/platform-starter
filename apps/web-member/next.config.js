const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = safeOrigin(process.env.NEXT_PUBLIC_API_URL);
const developmentConnections = isProduction ? [] : ['http:', 'ws:'];
const scriptDevelopment = isProduction ? [] : ["'unsafe-eval'"];
const antiBotScripts = [
  'https://challenges.cloudflare.com',
  'https://www.google.com',
  'https://www.gstatic.com',
  'https://js.hcaptcha.com',
  'https://*.hcaptcha.com',
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  ["script-src 'self' 'unsafe-inline'", ...scriptDevelopment, ...antiBotScripts].join(' '),
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  ["connect-src 'self' https: wss:", ...developmentConnections, ...(apiOrigin ? [apiOrigin] : [])].join(' '),
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  ["frame-src 'self'", ...antiBotScripts].join(' '),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const exactMobileAssetRewrites = [
  ['fire.svg', '/assets/asset-moblie/images/home/fire.svg'],
  ['mostonline.svg', '/assets/asset-moblie/images/home/mostonline.svg'],
  ['live.svg', '/assets/asset-moblie/images/home/live.svg'],
].flatMap(([fileName, destination]) => [
  { source: `/images/home/${fileName}`, destination },
  { source: `/assets/asset-pc/images/home/${fileName}`, destination },
]);

const canonicalPageRedirects = [
  { source: '/promotions', destination: '/browse/promotions?view=promotion', permanent: false },
  { source: '/mobile-menu/promotions', destination: '/browse/promotions?view=promotion', permanent: false },
  { source: '/mobile-menu/activities', destination: '/browse/promotions?view=activity', permanent: false },
  { source: '/mobile-menu/news', destination: '/browse/promotions?view=news', permanent: false },
  { source: '/mobile-menu/live', destination: '/live', permanent: false },
  { source: '/mobile-menu/guide', destination: '/guide', permanent: false },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/api-client'],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return canonicalPageRedirects;
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...exactMobileAssetRewrites,
        {
          source: '/assets/asset-pc/images/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png',
          destination: 'https://cdn.zabbet.com/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png',
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.zabbet.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'noah345.shop',
        pathname: '/**',
      },
    ],
  },
};

function safeOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

module.exports = withBundleAnalyzer(nextConfig);
