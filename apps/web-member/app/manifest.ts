import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NOAH345',
    short_name: 'NOAH345',
    description: 'NOAH345 member portal',
    start_url: '/',
    display: 'standalone',
    background_color: '#171422',
    theme_color: '#171422',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
