'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  Gift,
  Lock,
  Mail,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { BraceletGlyph } from '@/components/gallery/BraceletGlyph';
import { KIT_BY_ID } from '@/lib/mocks/kits';
import { useCart, cartSubtotal, cartShipping, cartTotal, subtotalForLine } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const FREE_SHIPPING_THRESHOLD = 60;

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  firstName: z.string().min(1, 'Requis'),
  lastName: z.string().min(1, 'Requis'),
  address: z.string().min(1, 'Requis'),
  addressExtra: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal à 5 chiffres'),
  city: z.string().min(1, 'Requis'),
  country: z.string().min(1, 'Requis'),
  phone: z.string().min(6, 'Numéro invalide'),
  newsletter: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Generate a short, human-readable order id for the receipt screen. */
function makeOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MNB-${year}-${rand}`;
}

/** Estimate the delivery window. DIY kits ship faster than handmade pieces.
 *  We compute two business-day windows from today; in production this would
 *  come from the back-end based on stock + atelier load. */
function estimateDelivery(now: Date, allDiy: boolean): { from: string; to: string } {
  const minDays = allDiy ? 2 : 5;
  const maxDays = allDiy ? 4 : 8;
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() + minDays);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + maxDays);
  return { from: fmt.format(fromDate), to: fmt.format(toDate) };
}

export function CheckoutClient() {
  const { lines, clear } = useCart();
  const subtotal = cartSubtotal(lines);
  const shipping = cartShipping(subtotal);
  const total = cartTotal(lines);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  const allDiy = useMemo(
    () =>
      lines.every(
        (l) => l.kind === 'custom' && l.config.fulfillmentMode === 'diy-kit',
      ),
    [lines],
  );
  const delivery = useMemo(() => estimateDelivery(new Date(), allDiy), [allDiy]);

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { country: 'France' },
  });

  async function onSubmit(values: FormValues) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    // Mock payment — back-end integration point
    await new Promise((r) => setTimeout(r, 900));
    const number = makeOrderNumber();
    setOrderNumber(number);
    clear();
    setSubmitted(true);
  }

  if (submitted) {
    return <ConfirmationScreen orderNumber={orderNumber} delivery={delivery} />;
  }

  if (lines.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <div className="container-editorial py-8 lg:py-12">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Panier', href: '/panier' },
            { label: 'Commande' },
          ]}
        />

        <div className="mt-6 mb-8 lg:mb-12 max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#A8BED4]">
            <Sparkles size={14} strokeWidth={2.2} />
            Dernière étape
          </span>
          <h1 className="mt-3 font-serif text-[34px] md:text-[52px] font-black uppercase leading-[0.95] tracking-tighter text-[#2D3748]">
            Finaliser
            <br />
            <span className="italic font-normal text-[#3D5A73]">la commande</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ─── FORM ─── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-7 space-y-6"
          >
            <Section step="1" icon={Mail} title="Contact">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <label className="mt-3 flex items-center gap-2 text-[13px] text-[#718096]">
                <input
                  type="checkbox"
                  {...register('newsletter')}
                  className="h-4 w-4 accent-[#3D5A73]"
                />
                Je souhaite recevoir la newsletter MyNiceBracelet
              </label>
            </Section>

            <Section step="2" icon={MapPin} title="Livraison">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Nom"
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>
              <div className="mt-4 space-y-4">
                <Input
                  label="Adresse"
                  autoComplete="street-address"
                  error={errors.address?.message}
                  {...register('address')}
                />
                <Input
                  label="Complément (facultatif)"
                  error={errors.addressExtra?.message}
                  {...register('addressExtra')}
                />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Input
                    label="Code postal"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    error={errors.postalCode?.message}
                    {...register('postalCode')}
                  />
                  <Input
                    label="Ville"
                    autoComplete="address-level2"
                    error={errors.city?.message}
                    {...register('city')}
                    className="sm:col-span-2"
                  />
                </div>
                <Input
                  label="Pays"
                  autoComplete="country-name"
                  error={errors.country?.message}
                  {...register('country')}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              {/* Delivery estimate */}
              <div className="mt-5 rounded-xl border border-[#D9E4D7] bg-[#F4FAF4] p-4 flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#244A35] shadow-sm">
                  <Truck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#244A35]">
                    Livraison estimée
                  </p>
                  <p className="mt-0.5 font-serif text-[15px] font-black tracking-tight text-[#2D3748]">
                    Entre le {delivery.from} et le {delivery.to}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#718096]">
                    {allDiy
                      ? 'Les kits DIY partent sous 48h ouvrées.'
                      : 'Bracelets assemblés à la main dans notre atelier parisien.'}
                  </p>
                </div>
              </div>
            </Section>

            <Section step="3" icon={CreditCard} title="Paiement">
              <div className="rounded-xl border border-dashed border-[#A8BED4] bg-white p-5 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0E8] text-[#3D5A73]">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-[#2D3748] max-w-md mx-auto">
                  Paiement sécurisé — Visa, Mastercard, Apple Pay
                </p>
                <p className="mt-1 text-[11px] text-[#718096]">
                  La passerelle Stripe / Mollie sera branchée à la mise en
                  ligne. Cette étape est un placeholder pour la démo.
                </p>
              </div>
            </Section>

            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              Payer {formatPrice(total)}
            </Button>
            <p className="text-[11px] text-center text-[#718096]">
              En validant, vous acceptez nos{' '}
              <Link href="/cgv" className="underline decoration-[#A8BED4] underline-offset-2 hover:text-[#2D3748]">
                CGV
              </Link>
              .
            </p>
          </form>

          {/* ─── ORDER SUMMARY ─── */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-[#EEE9E0] bg-white p-5 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                  <Package size={14} strokeWidth={2.2} />
                  Récapitulatif
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                  {lines.reduce((acc, l) => acc + l.quantity, 0)} article
                  {lines.reduce((acc, l) => acc + l.quantity, 0) > 1 ? 's' : ''}
                </span>
              </div>

              {/* Free shipping progress */}
              {remainingForFreeShipping > 0 ? (
                <div className="mb-5 rounded-lg bg-[#FBF8F2] border border-[#EEE9E0] p-3">
                  <p className="text-[11px] font-semibold text-[#718096]">
                    Plus que{' '}
                    <span className="font-black text-[#2D3748] tabular-nums">
                      {formatPrice(remainingForFreeShipping)}
                    </span>{' '}
                    pour la livraison offerte
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#EEE9E0] overflow-hidden">
                    <div
                      className="h-full bg-[#3D5A73] transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-5 rounded-lg bg-[#F4FAF4] border border-[#D9E4D7] p-3 flex items-center gap-2">
                  <Check size={14} strokeWidth={2.4} className="text-[#244A35]" />
                  <p className="text-[11px] font-semibold text-[#244A35]">
                    Livraison offerte débloquée !
                  </p>
                </div>
              )}

              {/* Cart lines */}
              <ul className="divide-y divide-[#EEE9E0]">
                {lines.map((line) => (
                  <li key={line.lineId} className="py-3 first:pt-0 last:pb-0">
                    <CartLineSummary line={line} />
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <dl className="mt-4 pt-4 space-y-2 border-t border-[#EEE9E0]">
                <div className="flex justify-between text-[13px] text-[#718096]">
                  <dt>Sous-total</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-[13px] text-[#718096]">
                  <dt>Livraison</dt>
                  <dd className={cn('tabular-nums', shipping === 0 && 'text-[#244A35] font-black')}>
                    {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
                  </dd>
                </div>
              </dl>
              <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-[#EEE9E0]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                  Total
                </span>
                <span className="font-serif text-[28px] font-black tracking-tighter text-[#2D3748] tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              <TrustBadge icon={Lock} label="Paiement sécurisé" />
              <TrustBadge icon={Truck} label="Livraison soignée" />
              <TrustBadge icon={Gift} label="Emballage offert" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  // Plain <section> + <h2> rather than <fieldset>/<legend> — the latter has
  // built-in browser positioning that places the legend ON the top border,
  // which clips the pill against our rounded white card. A regular header
  // sits comfortably inside the box.
  return (
    <section className="rounded-2xl border border-[#EEE9E0] bg-white p-5 lg:p-6 shadow-sm">
      <header className="flex items-center gap-2.5 mb-4 pb-4 border-b border-[#EEE9E0]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#3D5A73] text-white text-[10px] font-black tabular-nums">
          {step}
        </span>
        <h2 className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-[#2D3748]">
          <Icon size={13} strokeWidth={2.2} className="text-[#3D5A73]" />
          {title}
        </h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

function CartLineSummary({
  line,
}: {
  line: ReturnType<typeof useCart.getState>['lines'][number];
}) {
  if (line.kind === 'kit') {
    const kit = KIT_BY_ID[line.kitId];
    return (
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
          <Package size={18} strokeWidth={2} className="text-[#3D5A73]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black uppercase tracking-tight text-[#2D3748] truncate">
            {kit?.name ?? '—'}
          </p>
          <p className="text-[10px] font-semibold text-[#A8BED4] uppercase tracking-widest mt-0.5">
            Kit · qté {line.quantity}
          </p>
        </div>
        <span className="font-serif text-[15px] font-black tabular-nums text-[#2D3748] shrink-0">
          {formatPrice(subtotalForLine(line))}
        </span>
      </div>
    );
  }

  // Custom bracelet line — show a mini glyph preview
  const isDiy = line.config.fulfillmentMode === 'diy-kit';
  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-20 shrink-0 rounded-lg bg-[#EFE7DC] overflow-hidden">
        <BraceletGlyph
          components={line.config.components}
          figurine={line.config.figurine}
          sizeCm={line.config.sizeCm}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black uppercase tracking-tight text-[#2D3748] truncate">
          {line.config.title ?? 'Ma création'}
        </p>
        <p className="text-[10px] font-semibold text-[#A8BED4] uppercase tracking-widest mt-0.5">
          Qté {line.quantity}
        </p>
        <span
          className={cn(
            'mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
            isDiy
              ? 'bg-[#FFF8E6] text-[#8C6E1F] border border-[#E8D9A6]'
              : 'bg-[#F4FAF4] text-[#244A35] border border-[#D9E4D7]',
          )}
        >
          {isDiy ? 'Kit DIY' : 'Assemblé à Paris'}
        </span>
      </div>
      <span className="font-serif text-[15px] font-black tabular-nums text-[#2D3748] shrink-0">
        {formatPrice(subtotalForLine(line))}
      </span>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-[#EEE9E0] bg-white p-3 text-center">
      <Icon size={16} strokeWidth={2} className="mx-auto text-[#3D5A73]" />
      <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-[#718096] leading-tight">
        {label}
      </p>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <div className="container-editorial py-16 lg:py-24">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-[#EEE9E0] p-8 lg:p-10 shadow-sm">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8] text-[#3D5A73]">
            <Package size={22} strokeWidth={1.6} />
          </span>
          <h1 className="mt-5 font-serif text-[28px] font-black uppercase tracking-tight text-[#2D3748]">
            Votre panier est vide
          </h1>
          <p className="mt-3 text-[14px] text-[#718096] leading-relaxed">
            Composez votre bracelet ou parcourez nos kits avant de passer commande.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button href="/creer">Créer le mien</Button>
            <Button href="/galerie" variant="outline">
              Voir la galerie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationScreen({
  orderNumber,
  delivery,
}: {
  orderNumber: string;
  delivery: { from: string; to: string };
}) {
  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <div className="container-editorial py-12 lg:py-20">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#EEE9E0] p-8 lg:p-10 shadow-sm">
          <div className="text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F4FAF4] text-[#244A35]">
              <Check size={28} strokeWidth={2.4} />
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#244A35]">
              <Sparkles size={13} strokeWidth={2.2} />
              Commande confirmée
            </span>
            <h1 className="mt-3 font-serif text-[32px] md:text-[40px] font-black uppercase leading-[0.95] tracking-tighter text-[#2D3748]">
              Merci pour
              <br />
              <span className="italic font-normal text-[#3D5A73]">votre confiance</span>
            </h1>
            <p className="mt-4 text-[13px] text-[#718096] leading-relaxed">
              Un email de confirmation vient d&rsquo;être envoyé. Votre
              commande est entre les mains de notre atelier parisien.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#EEE9E0] bg-[#FBF8F2] p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                Numéro de commande
              </p>
              <p className="mt-1 font-serif text-[18px] font-black tracking-tighter text-[#2D3748] tabular-nums">
                {orderNumber}
              </p>
            </div>
            <div className="rounded-xl border border-[#D9E4D7] bg-[#F4FAF4] p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#244A35]">
                Livraison estimée
              </p>
              <p className="mt-1 font-serif text-[15px] font-black tracking-tight text-[#2D3748]">
                {delivery.from} – {delivery.to}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button href="/galerie">Découvrir la galerie</Button>
            <Button href="/creer" variant="outline">
              Composer un autre
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
