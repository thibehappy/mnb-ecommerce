import type { Kit, Boutique } from '@/types';

const BASE = 'https://mynicebracelet.com';

export function kitJsonLd(kit: Kit) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: kit.name,
    description: kit.description,
    brand: { '@type': 'Brand', name: 'MyNiceBracelet' },
    sku: kit.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: kit.price,
      availability:
        kit.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${BASE}/kits/${kit.slug}`,
    },
  };
}

export function boutiqueJsonLd(boutique: Boutique) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: boutique.name,
    telephone: boutique.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: boutique.address,
      postalCode: boutique.postalCode,
      addressLocality: boutique.city,
      addressCountry: 'FR',
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MyNiceBracelet',
    url: BASE,
    logo: `${BASE}/logo.png`,
    sameAs: ['https://instagram.com/mynicebracelet'],
  };
}
