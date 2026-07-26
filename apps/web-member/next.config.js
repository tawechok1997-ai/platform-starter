const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/api-client'],
  async redirects() {
    return [
      {
        source: '/clone-preview',
        destination: '/',
        permanent: false,
      },
      {
        source: '/clone-preview/:path*',
        destination: '/',
        permanent: false,
      },
    ];
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

module.exports = withBundleAnalyzer(nextConfig);
