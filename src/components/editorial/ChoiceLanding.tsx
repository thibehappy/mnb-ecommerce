'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Sparkles, Wand2 } from 'lucide-react';

export function ChoiceLanding() {
  return (
    <>
      {/* ─── TWO PATHS — direct entry on the choice ─── */}
      <section className="relative -mt-20 md:-mt-24 bg-[#1A202C] pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 20% 30%, rgba(61,90,115,0.6) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(168,190,212,0.2) 0%, transparent 60%)',
          }}
        />

        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-[10px] md:text-[11px] font-black uppercase text-[#A8BED4] tracking-[0.4em] mb-4 inline-block">
              Par où voulez-vous commencer ?
            </span>
            <h2 className="text-white text-3xl md:text-6xl font-serif font-black tracking-tighter uppercase leading-[1] mb-4">
              Deux façons,
              <br />
              <span className="italic font-normal text-[#A8BED4]">un même savoir-faire.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10 max-w-7xl mx-auto">
            <ChoiceCard
              href="/kits"
              label="Le kit tout fait"
              title="Un kit déjà composé"
              description="Une sélection de pierres et charms pensée par notre atelier. Tout le matériel arrive dans un coffret, vous assemblez à la maison."
              ctaLabel="Voir les kits"
              icon={<Box size={14} strokeWidth={2} />}
              image="/photos/atelier-kawaii-premium.jpg"
              imageAlt="Coffret kit My Nice Bracelet prêt à monter"
            />
            <ChoiceCard
              href="/creer"
              label="Le kit personnalisé"
              title="Je compose mon bracelet"
              description="Vous choisissez chaque pierre, chaque charm. À la fin, recevez votre kit à monter chez vous, ou directement votre bracelet assemblé à Paris par nos soins."
              ctaLabel="Ouvrir le configurateur"
              icon={<Wand2 size={14} strokeWidth={2} />}
              image="/photos/atelier-bracelet-bar.jpg"
              imageAlt="Sélection de perles en pierres naturelles sur le bar à bracelets"
              highlighted
            />
          </div>

          <div className="mt-14 md:mt-16 flex flex-wrap items-center justify-center gap-x-8 md:gap-x-14 gap-y-4 text-white/60">
            {[
              'Assemblé à Paris',
              'Pierres semi-précieuses',
              'Livraison rapide',
              'Paiement sécurisé',
            ].map((label) => (
              <span
                key={label}
                className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] inline-flex items-center gap-3"
              >
                <span className="w-1 h-1 rounded-full bg-[#A8BED4]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ChoiceCard({
  href,
  label,
  title,
  description,
  ctaLabel,
  icon,
  image,
  imageAlt,
  highlighted,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  icon: React.ReactNode;
  image: string;
  imageAlt: string;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link
        href={href}
        className="group relative block rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8BED4] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1A202C]"
      >
        {/* Photo stage */}
        <div className="relative h-[420px] sm:h-[480px] md:h-[560px] overflow-hidden">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-[1.06] transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            priority
          />

          {/* Bottom gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C] via-[#1A202C]/30 to-transparent" />

          {/* Top label pill */}
          <div className="absolute top-5 md:top-7 left-5 md:left-7 z-10">
            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#2D3748] shadow-md">
              {icon}
              {label}
            </span>
          </div>

          {/* Highlighted ribbon (custom path = featured) */}
          {highlighted && (
            <div className="absolute top-5 md:top-7 right-5 md:right-7 z-10">
              <span className="inline-flex items-center gap-1.5 bg-[#3D5A73] text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                <Sparkles size={10} />
                Le plus populaire
              </span>
            </div>
          )}

          {/* Hover CTA overlay — inspired by the main site AteliersSection */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A202C]/0 group-hover:bg-[#1A202C]/30 transition-all duration-500">
            <span className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-[#2D3748] font-black text-[11px] uppercase tracking-widest px-7 py-3.5 rounded-full shadow-2xl flex items-center gap-2">
              {ctaLabel} <ArrowRight size={14} strokeWidth={2.2} />
            </span>
          </div>

          {/* Bottom content over photo */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
            <h3 className="text-white text-2xl md:text-[38px] font-serif font-black uppercase tracking-tighter leading-[1.05] mb-3 drop-shadow-xl">
              {title}
            </h3>
            <p className="text-white/85 italic leading-relaxed text-sm md:text-base max-w-md drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
