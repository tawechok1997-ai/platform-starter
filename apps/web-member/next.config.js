/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/api-client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
      },
    ],
  },
};

module.exports = nextConfig;
