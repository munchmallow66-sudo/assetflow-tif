import type { MetadataRoute } from 'next';

/**
 * robots.ts — Controls search engine crawling behavior.
 * Since this is an internal enterprise app, only public pages (login, home) are indexable.
 * All authenticated routes are disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://assetflow-tif.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: [
          '/dashboard',
          '/assets',
          '/borrow',
          '/returns',
          '/reports',
          '/users',
          '/employees',
          '/settings',
          '/pending-approval',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
