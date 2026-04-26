import type { Metadata } from 'next';
import { CreerClient } from './CreerClient';

export const metadata: Metadata = {
  title: 'Créer mon bracelet',
  description:
    'Configurateur en ligne : choisissez un atelier, une taille, composez vos perles et charms. Assemblé à Paris.',
};

export default function CreerPage() {
  return <CreerClient />;
}
