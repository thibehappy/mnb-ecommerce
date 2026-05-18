/**
 * Thin data layer. Today it returns mock data; tomorrow the back-end dev
 * swaps each function for a fetch() against their endpoints.
 *
 * Keep these functions async and pure — no UI state here.
 */
import type { Atelier, Bead, BraceletBase, Charm } from '@/types';
import { BEADS, BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARMS, CHARM_BY_ID } from '@/lib/mocks/charms';
import { BASES, BASE_BY_ID } from '@/lib/mocks/bases';
import { ATELIERS, ATELIER_BY_ID, ATELIER_BY_SLUG } from '@/lib/mocks/ateliers';

/* ─── Catalogue primitives ─────────────────────────────────── */
export async function listBeads(): Promise<Bead[]> {
  return BEADS;
}

export async function getBead(id: string): Promise<Bead | null> {
  return BEAD_BY_ID[id] ?? null;
}

export async function listCharms(): Promise<Charm[]> {
  return CHARMS;
}

export async function getCharm(id: string): Promise<Charm | null> {
  return CHARM_BY_ID[id] ?? null;
}

export async function listBases(): Promise<BraceletBase[]> {
  return BASES;
}

export async function getBase(id: string): Promise<BraceletBase | null> {
  return BASE_BY_ID[id] ?? null;
}

/* ─── Ateliers ─────────────────────────────────────────────── */
export async function listAteliers(): Promise<Atelier[]> {
  return ATELIERS;
}

export async function getAtelier(id: string): Promise<Atelier | null> {
  return ATELIER_BY_ID[id] ?? null;
}

export async function getAtelierBySlug(slug: string): Promise<Atelier | null> {
  return ATELIER_BY_SLUG[slug] ?? null;
}

