import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/layout/Providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mynicebracelet.com'),
  title: {
    default: 'My Nice Bracelet — Bijoux personnalisés, faits à Paris',
    template: '%s — My Nice Bracelet',
  },
  description:
    'Composez votre bracelet avec nos pierres, charms et figurines. Kits à créer chez soi ou bracelets personnalisés en ligne. Boutique Paris.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'My Nice Bracelet',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F5F0E8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
