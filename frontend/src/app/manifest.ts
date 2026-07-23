import type { MetadataRoute } from 'next';

/**
 * manifest.ts — Web Application Manifest for PWA support.
 * Enables "Add to Home Screen" and provides branding metadata
 * for search engines and browsers.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TIF AssetFlow — ระบบจัดการยืม-คืนสินทรัพย์',
    short_name: 'TIF AssetFlow',
    description:
      'ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์ ภายในบริษัท Thai Inter Flying จำกัด',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0284c7',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-center.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
