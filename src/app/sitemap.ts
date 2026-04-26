import type { MetadataRoute } from 'next';
import { listKits } from '@/lib/api';

const BASE = 'https://mynicebracelet.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kits = await listKits();
  const staticRoutes = ['', '/kits', '/creer'].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }),
  );
  const kitRoutes = kits.map((k) => ({
    url: `${BASE}/kits/${k.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...kitRoutes];
}
