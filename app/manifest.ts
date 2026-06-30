import { MetadataRoute } from 'next';
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SocietyHub',
    short_name: 'SocietyHub',
    description: 'Modern society management app',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a', // Slate 900 for dark mode elegance
    theme_color: '#10b981', // Emerald 500
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
