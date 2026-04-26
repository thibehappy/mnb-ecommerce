# API Contract — MyNiceBracelet Front-end

Document d'alignement front ↔ back. Décrit les données que le front consomme et attend du back-end. Aucune logique métier n'est dupliquée côté front : tout calcul autoritatif (prix final, stock, TVA, expédition précise) doit être confirmé par le back au moment du checkout.

## Source de vérité des types

Tous les types TS sont dans [`src/types/index.ts`](./src/types/index.ts). Le back-end peut s'en inspirer ou s'y aligner directement (JSON schemas dérivables si besoin).

## Endpoints attendus

L'abstraction côté front est dans [`src/lib/api/index.ts`](./src/lib/api/index.ts). Chaque fonction mock sera remplacée par un `fetch()` vers l'endpoint correspondant.

| Fonction front | Méthode / URL suggérée | Réponse |
|---|---|---|
| `listBeads()` | `GET /api/beads` | `Bead[]` |
| `getBead(id)` | `GET /api/beads/:id` | `Bead` ou 404 |
| `listCharms()` | `GET /api/charms` | `Charm[]` |
| `getCharm(id)` | `GET /api/charms/:id` | `Charm` ou 404 |
| `listBases()` | `GET /api/bases` | `BraceletBase[]` |
| `getBase(id)` | `GET /api/bases/:id` | `BraceletBase` ou 404 |
| `listKits(params)` | `GET /api/kits?featured=1` | `Kit[]` |
| `getKitBySlug(slug)` | `GET /api/kits/slug/:slug` | `Kit` ou 404 |
| `getKit(id)` | `GET /api/kits/:id` | `Kit` ou 404 |
| `listInspirations()` | `GET /api/inspirations` | `Inspiration[]` |
| `listBoutiques()` | `GET /api/boutiques` | `Boutique[]` |

### Endpoints checkout (à définir)

| Besoin | Méthode / URL suggérée | Payload |
|---|---|---|
| Créer une commande | `POST /api/orders` | `{ lines: CartLine[], shipping: Address, contact: Contact }` → `{ orderId, paymentSessionUrl }` |
| Sauvegarder une création | `POST /api/designs` | `BraceletConfig` → `{ id }` |
| Lister ses créations (si compte) | `GET /api/designs` | `BraceletConfig[]` |

## Conventions

- **IDs** : chaînes (UUID ou slug). Le front ne les génère jamais pour des ressources serveur.
- **Prix** : nombres en euros (pas en centimes côté API — c'est le back qui convertit si besoin avant Stripe).
- **Dates** : ISO 8601 UTC (`2026-04-22T14:00:00Z`).
- **Images** : URLs absolues HTTPS, idéalement servies par un CDN (Next configurera les `remotePatterns`).
- **Stock** : `number`, 0 = rupture. Le front affiche l'état textuellement (*En stock*, *Plus que X*, *Rupture*).

## Ce que le front calcule en local (à re-vérifier côté back)

- **Prix estimé d'une création personnalisée** : `basePrice + Σ(componentPrice) + 8 € (supplément assemblage)`. Vérifier côté back au moment de la commande.
- **Frais de livraison** : offerts dès 60 €, 4,90 € sinon. Simple règle d'affichage — le back renvoie la règle autoritative au checkout.
- **Sous-total panier** : somme des lignes × quantités. Idem, vérifié côté back.

## Champs critiques par entité

### `Bead`
- `hex` **obligatoire** (le configurateur 2D en dépend)
- `veinHex` optionnel mais améliore fortement le rendu
- `shape` conditionne le dessin (`faceted`, `tube`, `nugget` ont des rendus spécifiques)
- `size` détermine le diamètre sur le canvas

### `Charm`
- `category` conditionne la forme SVG placeholder — ne pas créer de nouvelle catégorie sans prévenir le front
- `material` influence la couleur (dore / argente / email / pierre)

### `Kit`
- `palette` (array de 4 hex) : utilisé par `KitVisual` pour générer les placeholders. À remplir même si les photos existent — sert aussi aux previews dans le panier.
- `slug` unique, utilisé pour l'URL.

### `BraceletConfig` (création personnalisée)
- Le `id` est généré serveur à la sauvegarde (sinon localStorage-only côté client).
- `components` est un **tableau ordonné** — le back doit préserver l'ordre pour la reconstruction du visuel et l'assemblage.
- `estimatedPrice` est indicatif côté front ; le back renvoie le prix définitif.

## Authentification (à définir)

Actuellement non gérée côté front. Lorsque le back la livre :
- Endpoint `/api/auth/session` pour hydrater un état global
- `useConfigurator.savedDesigns` bascule de localStorage vers le serveur pour un utilisateur connecté (garder localStorage comme fallback pour les invités).

## Versioning

Si l'API évolue de manière breaking, préfixer les URLs (`/api/v2/...`). Le front exporte une constante `API_VERSION` à ajouter dans `lib/api/index.ts` le moment venu.

## Contact

Questions d'intégration : ouvrir une issue ou contacter le/la responsable front.
