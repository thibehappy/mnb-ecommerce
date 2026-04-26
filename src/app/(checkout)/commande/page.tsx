import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = { title: 'Commande' };

export default function CommandePage() {
  return <CheckoutClient />;
}
