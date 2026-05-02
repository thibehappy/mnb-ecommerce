'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { KIT_BY_ID } from '@/lib/mocks/kits';
import { useCart, cartSubtotal, cartShipping, cartTotal, subtotalForLine } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/format';

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

export function CheckoutClient() {
  const { lines, clear } = useCart();
  const subtotal = cartSubtotal(lines);
  const shipping = cartShipping(subtotal);
  const total = cartTotal(lines);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { country: 'France' },
  });

  async function onSubmit(values: FormValues) {
    // Validate via Zod manually (back-end will redo this)
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    // Mock payment — back-end integration point
    await new Promise((r) => setTimeout(r, 900));
    clear();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="container-editorial py-20">
        <div className="max-w-lg mx-auto text-center bg-[var(--color-paper)] p-10 rounded-sm">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-sage)] text-[var(--color-canvas)] mb-6">
            <Check size={24} strokeWidth={1.6} />
          </div>
          <h1 className="text-display-m mb-3">Commande confirmée</h1>
          <p className="text-[15px] text-[var(--color-graphite)] leading-relaxed mb-8">
            Merci ! Un email de confirmation vient de vous être envoyé. Votre commande est en
            préparation dans notre atelier parisien.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button href="/">Retour à l&rsquo;accueil</Button>
            <Button href="/kits" variant="outline">
              Continuer mes achats
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-editorial py-20">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-display-m mb-4">Votre panier est vide</h1>
          <p className="mb-8 text-[var(--color-graphite)]">
            Parcourez nos kits ou créez votre bracelet avant de passer commande.
          </p>
          <Button href="/kits">Voir les kits</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-editorial py-10 lg:py-16">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Panier', href: '/panier' },
          { label: 'Commande' },
        ]}
      />
      <h1 className="text-display-l mt-8 mb-10">Finaliser la commande</h1>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-10">
          <fieldset className="space-y-5">
            <legend className="text-display-s mb-4">Contact</legend>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="flex items-center gap-2">
              <input id="newsletter" type="checkbox" {...register('newsletter')} className="h-4 w-4 accent-[var(--color-ink)]" />
              <label htmlFor="newsletter" className="text-[13px] text-[var(--color-graphite)]">
                Je souhaite recevoir la newsletter MyNiceBracelet
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="text-display-s mb-4">Livraison</legend>
            <div className="grid sm:grid-cols-2 gap-5">
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
            <div className="grid sm:grid-cols-3 gap-5">
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
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-display-s mb-4">Paiement</legend>
            <div className="p-6 border border-[var(--color-line-strong)] rounded-sm bg-[var(--color-paper)] text-center">
              <Lock size={18} className="inline text-[var(--color-gold-deep)]" strokeWidth={1.4} />
              <p className="mt-3 text-[14px] text-[var(--color-graphite)] max-w-md mx-auto">
                Le paiement sécurisé sera pris en charge par la plateforme partenaire (Stripe /
                Mollie) une fois le back-end connecté.
              </p>
              <p className="text-caption mt-2">
                Cette étape est un placeholder pour la démonstration front-end.
              </p>
            </div>
          </fieldset>

          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Payer {formatPrice(total)}
          </Button>
          <p className="text-caption text-center">
            En validant, vous acceptez nos <Link href="/cgv" className="link-underline">CGV</Link>.
          </p>
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[var(--color-paper)] p-6 lg:p-8 rounded-sm">
          <h2 className="text-display-s mb-6">Commande</h2>
          <ul className="divide-y divide-[var(--color-line)] mb-6">
            {lines.map((line) => (
              <li key={line.lineId} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {line.kind === 'kit'
                      ? (KIT_BY_ID[line.kitId]?.name ?? '—')
                      : (line.config.title ?? 'Création personnalisée')}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Quantité {line.quantity}
                    {line.kind === 'custom'
                      ? ` · ${
                          line.config.fulfillmentMode === 'diy-kit'
                            ? 'Kit DIY'
                            : 'Assemblé à Paris'
                        }`
                      : ''}
                  </p>
                </div>
                <span className="tabular-nums text-[14px]">
                  {formatPrice(subtotalForLine(line))}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 pb-5 border-b border-[var(--color-line)]">
            <div className="flex justify-between text-[13px]">
              <dt>Sous-total</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-[13px]">
              <dt>Livraison</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
              </dd>
            </div>
          </dl>
          <div className="flex justify-between items-baseline pt-5">
            <span className="text-[13px]">Total</span>
            <span className="font-serif text-[24px] tabular-nums">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
