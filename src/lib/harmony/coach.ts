import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import type { SizeFit } from '@/lib/store/configurator';

export type CoachTone = 'empty' | 'progress' | 'ready' | 'issue';
export type CoachAction = 'generate' | 'complete' | 'name' | 'share';

export interface CoachCheck {
  id: string;
  label: string;
  ok: boolean;
}

export interface CoachSuggestion {
  id: string;
  label: string;
  detail: string;
  action?: CoachAction;
}

export interface BraceletCoachInsight {
  score: number;
  label: string;
  tone: CoachTone;
  summary: string;
  signature: string;
  checks: CoachCheck[];
  suggestions: CoachSuggestion[];
}

interface AnalyzeBraceletDesignInput {
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  fit: SizeFit;
  title?: string;
  intention?: string;
}

export function analyzeBraceletDesign({
  components,
  figurine,
  fit,
  title,
  intention,
}: AnalyzeBraceletDesignInput): BraceletCoachInsight {
  const beads = components
    .filter((component) => component.kind === 'bead')
    .map((component) => BEAD_BY_ID[component.refId])
    .filter((bead): bead is NonNullable<(typeof BEAD_BY_ID)[string]> => Boolean(bead));
  const charms = components
    .filter((component) => component.kind === 'charm')
    .map((component) => CHARM_BY_ID[component.refId])
    .filter((charm): charm is NonNullable<(typeof CHARM_BY_ID)[string]> => Boolean(charm));
  const familyCount = new Set(beads.map((bead) => bead.family)).size;
  const hasTitle = Boolean(title?.trim());
  const hasIntention = Boolean(intention?.trim());
  const hasAccent = charms.length > 0 || Boolean(figurine);
  const hasEnoughPieces = components.length >= 8;
  const hasVariety = familyCount >= 2 || hasAccent;

  let score = components.length === 0 ? 12 : 28;
  if (fit.status === 'ready') score += 34;
  else if (fit.status === 'too-short' && fit.targetMm > 0) {
    score += Math.min(24, Math.round((fit.lengthMm / fit.targetMm) * 24));
  } else if (fit.status === 'too-long') {
    score -= 10;
  }
  if (hasEnoughPieces) score += 10;
  if (hasVariety) score += 12;
  if (familyCount >= 3) score += 5;
  if (hasAccent) score += 7;
  if (hasTitle) score += 5;
  if (hasIntention) score += 5;
  score = clamp(score, 0, 100);

  const tone: CoachTone =
    fit.status === 'empty'
      ? 'empty'
      : fit.status === 'too-long'
        ? 'issue'
        : fit.status === 'ready'
          ? 'ready'
          : 'progress';

  return {
    score,
    tone,
    label: labelFor(score, fit.status),
    summary: summaryFor(fit.status, fit.remainingMm, fit.overflowMm),
    signature: signatureFor(beads, charms.length, Boolean(figurine)),
    checks: [
      { id: 'fit', label: 'Ajustement', ok: fit.status === 'ready' },
      { id: 'pieces', label: 'Matière', ok: hasEnoughPieces },
      { id: 'variety', label: 'Variation', ok: hasVariety },
      { id: 'story', label: 'Histoire', ok: hasTitle || hasIntention },
    ],
    suggestions: suggestionsFor({
      components,
      fit,
      familyCount,
      hasTitle,
      hasIntention,
      hasAccent,
    }),
  };
}

function labelFor(score: number, status: SizeFit['status']): string {
  if (status === 'empty') return 'À démarrer';
  if (status === 'too-long') return 'À corriger';
  if (score >= 86) return 'Signature mondiale';
  if (score >= 72) return 'Prêt boutique';
  if (score >= 55) return 'Très proche';
  return 'En construction';
}

function summaryFor(status: SizeFit['status'], remainingMm: number, overflowMm: number): string {
  if (status === 'empty') return 'Une base guidée peut créer un premier rythme en quelques secondes.';
  if (status === 'ready') return 'La longueur est prête. Le design peut passer en partage ou au panier.';
  if (status === 'too-long') return `Le bracelet dépasse de ${formatCm(overflowMm)}. Une pièce doit sortir.`;
  return `Il manque encore ${formatCm(remainingMm)} pour atteindre une longueur confortable.`;
}

function signatureFor(
  beads: Array<NonNullable<(typeof BEAD_BY_ID)[string]>>,
  charmCount: number,
  hasFigurine: boolean,
): string {
  if (beads.length === 0) return 'Toile blanche';
  const familyCounts = new Map<string, number>();
  for (const bead of beads) familyCounts.set(bead.family, (familyCounts.get(bead.family) ?? 0) + 1);
  const dominant = [...familyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mix';
  const accent = hasFigurine ? 'figurine' : charmCount > 0 ? 'charm' : 'sans charm';
  return `${dominant.replace('-', ' ')} · ${accent}`;
}

function suggestionsFor({
  components,
  fit,
  familyCount,
  hasTitle,
  hasIntention,
  hasAccent,
}: {
  components: BraceletComponent[];
  fit: SizeFit;
  familyCount: number;
  hasTitle: boolean;
  hasIntention: boolean;
  hasAccent: boolean;
}): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = [];

  if (components.length === 0) {
    suggestions.push({
      id: 'generate',
      label: 'Créer une base',
      detail: 'Un rythme complet selon le mood sélectionné.',
      action: 'generate',
    });
    return suggestions;
  }

  if (fit.status === 'too-short') {
    suggestions.push({
      id: 'complete',
      label: 'Compléter la longueur',
      detail: `${formatCm(fit.remainingMm)} à ajouter sans dépasser la taille choisie.`,
      action: 'complete',
    });
  }

  if (fit.status === 'too-long') {
    suggestions.push({
      id: 'too-long',
      label: 'Alléger le rythme',
      detail: `${formatCm(fit.overflowMm)} en trop. Retirez une grosse perle ou un charm.`,
    });
  }

  if (familyCount < 2 && components.length >= 8) {
    suggestions.push({
      id: 'variety',
      label: 'Ajouter un accent',
      detail: 'Une deuxième matière rend la composition plus identifiable.',
    });
  }

  if (!hasAccent && components.length >= 12) {
    suggestions.push({
      id: 'accent',
      label: 'Marquer le centre',
      detail: 'Un charm ou une figurine donne un point focal au bracelet.',
    });
  }

  if (!hasTitle && !hasIntention) {
    suggestions.push({
      id: 'story',
      label: 'Signer la création',
      detail: 'Un nom ou une intention augmente la valeur émotionnelle.',
      action: 'name',
    });
  }

  if (fit.status === 'ready' && (hasTitle || hasIntention)) {
    suggestions.push({
      id: 'share',
      label: 'Faire valider',
      detail: 'La carte partage est prête pour demander un avis.',
      action: 'share',
    });
  }

  return suggestions.slice(0, 3);
}

function formatCm(mm: number): string {
  return `${(mm / 10).toFixed(1).replace('.', ',')} cm`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
