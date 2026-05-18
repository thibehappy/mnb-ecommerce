import { redirect } from 'next/navigation';

/**
 * The home page no longer offers a "kit vs personnaliser" choice — the
 * kits product line was removed, so the only path is the configurator.
 * Redirect to /creer where the atelier selection screen is the first
 * thing users see.
 */
export default function HomePage() {
  redirect('/creer');
}
