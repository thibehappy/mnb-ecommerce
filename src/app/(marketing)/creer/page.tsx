import type { Metadata } from 'next';
import { CreerClient } from './CreerClient';

export const metadata: Metadata = {
  title: 'Créer mon bracelet',
  description:
    'Le Studio My Nice Bracelet : composez vos perles et charms, puis choisissez une pièce assemblée à Paris ou un kit DIY.',
};

export default function CreerPage() {
  return <CreerClient />;
}
