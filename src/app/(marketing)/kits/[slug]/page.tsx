import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getKitBySlug, listKits } from '@/lib/api';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { Accordion } from '@/components/ui/Accordion';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import { KitVisual } from '@/components/ui/KitVisual';
import { KitCard } from '@/components/commerce/KitCard';
import { AddKitCta } from './AddKitCta';
import { kitJsonLd } from '@/lib/seo/jsonLd';
import { formatPrice } from '@/lib/utils/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getKitBySlug(slug);
  if (!kit) return { title: 'Kit introuvable' };
  return {
    title: kit.name,
    description: kit.description,
    openGraph: { title: kit.name, description: kit.description },
  };
}

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kit = await getKitBySlug(slug);
  if (!kit) notFound();

  const allKits = await listKits();
  const related = allKits.filter((k) => k.slug !== kit.slug).slice(0, 3);

  const beads = kit.beads
    .map((b) => {
      const bead = BEAD_BY_ID[b.beadId];
      return bead ? { ...bead, quantity: b.quantity } : null;
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const charms = kit.charms
    .map((c) => {
      const charm = CHARM_BY_ID[c.charmId];
      return charm ? { ...charm, quantity: c.quantity } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(kitJsonLd(kit)) }}
      />

      <section className="py-10 md:py-16 bg-[#F5F0E8]">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="text-[10px] font-black uppercase tracking-widest mb-8 text-[#718096]">
            <Link href="/" className="hover:text-[#2D3748]">Accueil</Link>
            <span className="mx-2">·</span>
            <Link href="/kits" className="hover:text-[#2D3748]">Kits</Link>
            <span className="mx-2">·</span>
            <span className="text-[#2D3748]">{kit.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 md:gap-14 items-start">
            {/* Visual */}
            <div className="lg:col-span-7">
              <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-[#EEE9E0]">
                <KitVisual palette={kit.palette} name={kit.name} aspect="square" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {kit.palette.slice(0, 4).map((hex, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[1rem] md:rounded-[1.5rem] bg-white border border-[#EEE9E0] flex items-center justify-center shadow-sm"
                  >
                    <StoneSwatch hex={hex} size={60} glossy />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
              <div className="flex gap-2 mb-5 flex-wrap">
                {kit.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-[#EEE9E0] bg-white text-[#3D5A73] px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-none mb-4">
                {kit.name}
              </h1>
              <p className="text-base md:text-lg text-[#718096] italic mb-6 leading-relaxed">
                {kit.tagline}
              </p>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl md:text-5xl font-serif font-black text-[#2D3748] tracking-tighter tabular-nums">
                  {formatPrice(kit.price)}
                </span>
                {kit.numberOfBracelets > 1 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#3D5A73] bg-[#F5F0E8] border border-[#EEE9E0] px-2.5 py-1 rounded-full">
                    Duo · 2 bracelets
                  </span>
                )}
              </div>

              <p className="text-[15px] leading-relaxed text-[#718096] italic mb-8">
                {kit.description}
              </p>

              <dl className="grid grid-cols-3 gap-2 mb-8 p-4 bg-white rounded-[1.5rem] border border-[#EEE9E0] shadow-sm">
                <StatBox label="Niveau" value={kit.difficulty} />
                <StatBox label="Durée" value={kit.makeTime} />
                <StatBox label="Bracelets" value={`${kit.numberOfBracelets}`} />
              </dl>

              <AddKitCta kit={kit} />

              <div className="mt-10">
                <Accordion
                  defaultOpen={0}
                  items={[
                    {
                      title: "Ce qu'il y a dans le coffret",
                      content: <KitContents beads={beads} charms={charms} />,
                    },
                    {
                      title: 'Expédition',
                      content: (
                        <p>
                          Préparé sous 2 jours ouvrés à Paris. Livraison Colissimo 2-4 jours en
                          France métropolitaine. Offerte dès 60 €.
                        </p>
                      ),
                    },
                    {
                      title: 'Retours',
                      content: (
                        <p>
                          14 jours pour retourner votre kit non utilisé. Retour gratuit, avec le
                          bordereau inclus dans le coffret.
                        </p>
                      ),
                    },
                    {
                      title: "L'histoire du kit",
                      content: <p>{kit.longDescription}</p>,
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <h2 className="text-2xl md:text-4xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-none">
              Vous aimerez aussi
            </h2>
            <Link
              href="/kits"
              className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#3D5A73] hover:text-[#2D3748] inline-flex items-center gap-2 transition-colors"
            >
              Tous les kits <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {related.map((k) => (
              <KitCard key={k.id} kit={k} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">{label}</p>
      <p className="font-serif font-black text-[14px] md:text-[16px] text-[#2D3748] uppercase">
        {value}
      </p>
    </div>
  );
}

type BeadWithQty = (typeof BEAD_BY_ID)[string] & { quantity: number };
type CharmWithQty = (typeof CHARM_BY_ID)[string] & { quantity: number };

function KitContents({ beads, charms }: { beads: BeadWithQty[]; charms: CharmWithQty[] }) {
  return (
    <div className="space-y-5">
      {beads.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5A73] mb-3">
            Perles
          </p>
          <ul className="flex flex-wrap gap-2">
            {beads.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-2 bg-white border border-[#EEE9E0] rounded-full pl-2 pr-4 py-1.5 shadow-sm"
              >
                <StoneSwatch hex={b.hex} veinHex={b.veinHex} size={22} glossy={false} />
                <span className="text-[12px]">
                  {b.name} <span className="text-[#A8BED4]">× {b.quantity}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {charms.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5A73] mb-3">
            Charms
          </p>
          <ul className="flex flex-wrap gap-2">
            {charms.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 bg-white border border-[#EEE9E0] rounded-full pl-2 pr-4 py-1.5 shadow-sm"
              >
                <CharmGlyph category={c.category} material={c.material} size={22} />
                <span className="text-[12px]">
                  {c.name} <span className="text-[#A8BED4]">× {c.quantity}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="text-[13px] text-[#718096] italic space-y-1.5 pt-2">
        <li>· Fil élastique haute tenue (rechange compris)</li>
        <li>· Notice illustrée format A5</li>
        <li>· Coffret carton recyclé</li>
      </ul>
    </div>
  );
}
