import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { BraceletPreview } from '@/components/configurator/BraceletPreview';
import { uid } from '@/lib/utils/format';

const DEMO = [
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_onyx_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_pearl_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_onyx_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_lapis_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_pearl_6' },
  { slotId: uid('s'), kind: 'charm' as const, refId: 'charm_moon_gold' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_pearl_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_lapis_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_onyx_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_pearl_6' },
  { slotId: uid('s'), kind: 'bead' as const, refId: 'bead_onyx_6' },
];

export function ConfiguratorTease() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl relative bg-[#F5F0E8] h-[320px] sm:h-[400px] md:h-[450px] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
              <BraceletPreview components={DEMO} variant="loop" />
            </div>
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2D3748] inline-flex items-center gap-2">
                <Sparkles size={12} /> Aperçu temps réel
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={16} className="text-[#3D5A73]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                5 minutes · 4 étapes
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-[#2D3748] mb-4 uppercase tracking-tight leading-tight">
              Le configurateur
            </h2>
            <p className="text-[#718096] text-base md:text-lg italic leading-relaxed mb-6">
              Choisissez votre fil, ajoutez vos pierres une à une, glissez des charms. Un bouton
              Inspire-moi compose pour vous une harmonie si vous hésitez.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-[10px] font-black uppercase text-[#3D5A73] tracking-widest">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Aperçu temps réel pendant la composition
              </li>
              <li className="flex items-center gap-3 text-[10px] font-black uppercase text-[#3D5A73] tracking-widest">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Sauvegardez vos créations pour y revenir
              </li>
              <li className="flex items-center gap-3 text-[10px] font-black uppercase text-[#3D5A73] tracking-widest">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Assemblage et expédition sous 5 jours ouvrés
              </li>
            </ul>
            <Link
              href="/creer"
              className="inline-flex items-center justify-center gap-2 w-fit px-8 md:px-10 py-4 font-black tracking-widest uppercase text-[11px] bg-[#3D5A73] text-white rounded-xl shadow-md hover:bg-[#2A3F50] active:scale-95 transition-all"
            >
              Commencer <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
