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
  "frame-ancestors 'none'",
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
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/api-client'],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
