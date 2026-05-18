const ITEMS = [
  'Assemblé à Paris',
  'Pierres semi-précieuses',
  'Personnalisé',
  'Livraison rapide',
  'Paiement sécurisé',
];

export function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section className="mnb-marquee bg-white border-y border-[#EEE9E0] py-10 md:py-14">
      <div className="mnb-marquee-track">
        {loop.map((item, i) => (
          <div key={`${item}-${i}`} className="inline-flex items-center shrink-0 select-none whitespace-nowrap">
            <span className="font-serif font-black text-[22px] md:text-[28px] text-[#2D3748] uppercase tracking-tighter">
              {item}
            </span>
            <span className="mx-8 md:mx-12 lg:mx-16 w-1.5 h-1.5 rounded-full bg-[#3D5A73]/40 shrink-0 inline-block" />
          </div>
        ))}
      </div>
    </section>
  );
}
