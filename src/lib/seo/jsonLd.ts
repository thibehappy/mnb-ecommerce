import type { Boutique } from '@/types';

const BASE = 'https://mynicebracelet.com';

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
