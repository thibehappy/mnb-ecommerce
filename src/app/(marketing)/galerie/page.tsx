import type { Metadata } from 'next';
import { GalerieClient } from './GalerieClient';

export const metadata: Metadata = {
  title: 'Galerie — Les créations partagées',
  description:
    'Découvrez les bracelets composés par notre communauté. Votez pour vos préférés.',
};

export default function GaleriePage() {
  return <GalerieClient />;
}
