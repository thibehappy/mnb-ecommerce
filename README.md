# MyNiceBracelet — E-commerce Front-end

Plateforme e-commerce complémentaire au site [mynicebracelet.com](https://mynicebracelet.com). Front-end complet pour la vente de kits de création et la personnalisation de bracelets via un configurateur en ligne.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict + `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** (tokens `@theme` dans `globals.css`)
- **Framer Motion** pour les animations de feedback
- **Zustand** (panier, configurateur) avec persistence localStorage
- **React Hook Form + Zod** pour les formulaires checkout
- **TanStack Query** prêt pour quand le back-end sera branché
- **Lucide React** pour les icônes
- **Fraunces** (serif variable) + **Inter** via `next/font`

## Démarrage

```bash
npm install
npm run dev         # http://localhost:3000
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Lance le serveur compilé |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unités) |
| `npm run test:e2e` | Playwright (parcours) |

## Structure

```
src/
├── app/
│   ├── (marketing)/           # Layout éditorial (Header + Footer)
│   │   ├── page.tsx           # Home
│   │   ├── kits/              # Catalogue + détail
│   │   ├── creer/             # Configurateur
│   │   ├── inspirations/      # Galerie signature
│   │   ├── boutiques/         # Les deux adresses parisiennes
│   │   └── a-propos/          # Storytelling
│   ├── (checkout)/            # Layout épuré (sans nav distractive)
│   │   ├── panier/
│   │   └── commande/          # Form RHF + Zod, paiement placeholder
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── layout.tsx             # Fonts, metadata, Providers
│   └── globals.css            # Tokens Tailwind v4 + reset
├── components/
│   ├── ui/                    # Primitives (Button, Input, Chip, StoneSwatch…)
│   ├── layout/                # Header, Footer, AnnouncementBar, MobileNav
│   ├── editorial/             # Hero, StoneStrip, ConfiguratorTease…
│   ├── commerce/              # KitCard, CartDrawer, CartLineItem
│   └── configurator/          # Canvas 2D, pickers, moteur d'harmonie
├── lib/
│   ├── api/                   # Couche d'abstraction (mocks → fetch réel)
│   ├── mocks/                 # Données catalogue (beads, charms, kits, etc.)
│   ├── store/                 # Zustand : cart + configurator
│   ├── harmony/               # "Inspire-moi" — règles de composition
│   ├── seo/                   # JSON-LD helpers
│   └── utils/                 # cn, format, slugify, uid
└── types/                     # Domaine partagé (voir API_CONTRACT.md)
```

## Le configurateur

La pièce maîtresse du site : `/creer`. Quatre étapes pilotées par un store Zustand persistant (`src/lib/store/configurator.ts`) :

1. **Base** — type de fil/chaîne, taille du poignet
2. **Perles** — sélection filtrable par matière et forme
3. **Charms** — filtrable par catégorie (cœurs, étoiles, kawaii…)
4. **Aperçu** — récap + ajout panier

Le rendu 2D est 100 % SVG, pas de bitmap, pas de 3D. Chaque perle est dessinée avec un radial-gradient + veining + highlight pour simuler la pierre. Voir `src/components/configurator/BraceletPreview.tsx`.

### Le moteur "Inspire-moi"

Situé dans `src/lib/harmony/rules.ts`. Ce n'est **pas** un vrai aléatoire : on définit 7 moods (`jardin`, `nuit`, `solaire`, `romantique`, `minimaliste`, `kawaii`, `mystique`), chacun associé à 2-3 familles de pierres compatibles et des catégories de charms cohérentes. Le pattern généré est symétrique avec un charm central et des perles primaires/secondaires/accent.

Pour ajouter un mood : éditer `RECIPES` dans `rules.ts`. Pas d'autre modification nécessaire.

## Données & placeholders

Tout le catalogue est mocké dans `src/lib/mocks/` :

- **~20 perles** sur 12 familles de pierres (améthyste, turquoise, onyx, etc.)
- **~20 charms** sur 8 catégories (y compris la signature kawaii MNB)
- **4 bases** (élastique, cordon, chaîne dorée, chaîne argent)
- **6 kits** dont 3 featured sur la home
- **4 inspirations** signatures dans la galerie
- **2 boutiques** (Le Marais, Montmartre)

**Placeholders visuels** : toute image produit est actuellement un SVG dessiné à la volée (`StoneSwatch`, `CharmGlyph`, `KitVisual`). Dès que les macros photo sont livrées, il suffit de :

1. Poser les fichiers dans `public/photos/beads/...`, `public/photos/kits/...`, etc.
2. Remplir les tableaux `images: string[]` dans les mocks.
3. Remplacer les occurrences de `<StoneSwatch …>` par `<Image …>` ou un composant hybride.

Les couleurs hex dans les mocks restent utiles même après photos : le configurateur les utilise pour composer le bracelet temps réel.

## Stores Zustand

**`useCart`** — lignes de panier persistées, calcul de sous-total, livraison (offerte ≥ 60 €), total, compteur.

**`useConfigurator`** — état du bracelet en cours, étape, composants, créations sauvegardées (max 24, localStorage). Fonction `applyInspired(mood?)` pour l'harmony engine.

## Design system

Tous les tokens sont dans `src/app/globals.css` via `@theme`. Palette complète, typo, spacing, radius, motion.

Pour créer un nouveau composant UI : s'en tenir aux **variables CSS** (`var(--color-ink)`), pas d'hex en dur. Radius max **8px**, jamais `rounded-2xl`. Shadows uniquement sur drawer/modal.

## SEO

- `app/sitemap.ts` dynamique (inclut tous les slugs de kits)
- `app/robots.ts` (block `/panier` et `/commande`)
- Metadata par page via `export const metadata`
- JSON-LD Product sur les pages kit (voir `lib/seo/jsonLd.ts`)

## Quand le back-end arrive

La couche d'abstraction est dans `src/lib/api/index.ts`. Chaque fonction renvoie aujourd'hui la donnée mockée — il suffit de les remplacer par un `fetch()` typé sans toucher au reste de l'app.

Contrat détaillé dans [`API_CONTRACT.md`](./API_CONTRACT.md).

## Performances

- Fonts variables + `next/font` (pas de FOUT)
- Images `next/image` prêtes (à peupler une fois les photos livrées)
- `optimizePackageImports` activé sur `lucide-react` + `framer-motion`
- SVG inline pour les orbes (pas de bitmap, compressible via gzip)
- Prefetch sur les 2 premières cards de la home

## Ce qui reste à faire (post-handover)

- [ ] Intégration paiement (Stripe / Mollie) côté back
- [ ] Compte utilisateur (sauvegarde serveur des créations)
- [ ] Upload des vraies photos produits
- [ ] Tests Playwright du parcours achat complet
- [ ] Intégration d'un outil de suivi (Plausible, Posthog côté back)
- [ ] Mention légale / CGV / confidentialité (contenu juridique à fournir)

## Équipe

Front-end : ce repo. Back-end : projet séparé, à relier via `src/lib/api/`.
