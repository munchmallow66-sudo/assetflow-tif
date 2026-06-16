import type { MetadataRoute } from 'next';

/**
 * sitemap.ts — Generates sitemap.xml dynamically.
 * Only public-facing pages are listed since authenticated pages
 * are blocked by robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://assetflow-tif.vercel.app';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
