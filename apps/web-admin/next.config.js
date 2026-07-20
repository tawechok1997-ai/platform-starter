/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/api-client'],
  poweredByHeader: false,
  reactStrictMode: true,
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
