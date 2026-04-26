import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-editorial py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <p className="font-mono text-[12px] text-[var(--color-muted)] mb-4">404</p>
        <h1 className="text-display-xl mb-4 max-w-lg">
          Cette page s&rsquo;est perdue en chemin.
        </h1>
        <p className="text-[16px] text-[var(--color-graphite)] mb-8 max-w-sm">
          Le lien n&rsquo;existe plus, ou nous l&rsquo;avons déplacé. Retrouvez nos créations ici.
        </p>
        <div className="flex gap-3">
          <Button href="/">Retour à l&rsquo;accueil</Button>
          <Button href="/kits" variant="outline">
            Voir les kits
          </Button>
        </div>
        <Link href="/creer" className="mt-8 link-underline text-[13px]">
          Ou créer un bracelet
        </Link>
      </main>
      <Footer />
    </>
  );
}
