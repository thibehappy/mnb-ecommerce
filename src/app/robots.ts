import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/panier', '/commande'],
      },
    ],
    sitemap: 'https://mynicebracelet.com/sitemap.xml',
  };
}
