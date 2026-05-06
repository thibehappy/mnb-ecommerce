# API Contract — MyNiceBracelet Front-end ↔ Back-end

Document d'alignement entre le front Next.js (ce repo, refait à neuf) et le back-end / admin que tu maintiens sur `platform.garcapps.fr`.

**À qui s'adresse ce document :** au développeur back-end (toi, Thibaud) qui va exposer une API REST consommée par le front. Aucune logique métier n'est dupliquée côté front : tout calcul autoritatif (prix final, stock, TVA, expédition précise) doit être confirmé par le back au moment du checkout.

---

## 1. Vue d'ensemble

### État actuel

- **Front Next.js (`thibehappy/mnb-ecommerce`)** — refondu, totalement fonctionnel avec un catalogue **mocké** dans `src/lib/mocks/`. Photos produits déjà détourées dans `public/photos/beads/...`. Configurateur 4 étapes opérationnel.
- **Admin existant (`platform.garcapps.fr/custommynicebracelet/admin.php`)** — interface PHP qui gère aujourd'hui :
  - 55 charms (modèles 3D `.glb / .gltf / .fbx / .obj` + textures PBR : albedo, normal, rugosité, métallique)
  - 2 bases avec config JSON (`shape: line|oval`, `line_radius`, `line_length`, `line_y`, `pick_radius`)
  - Stats commandes / sauvegardes / licence

### Objectif de cette doc

Te donner exactement ce qu'il faut pour :
1. **Conserver ton admin** (pas de réécriture)
2. **Enrichir ton schéma** pour qu'il expose les champs que le front consomme
3. **Ajouter une couche API REST** qui parle JSON
4. Brancher le front en remplaçant `src/lib/mocks/*` par des `fetch()` réels

---

## 2. Décision architecturale : **2D SVG/PNG, pas de 3D**

⚠ **Point le plus important — à valider avant tout code.**

Ton admin actuel est conçu pour du rendu 3D (modèles GLB + textures PBR). Le front Next.js refait par Dany est en **rendu 2D** :

- Le configurateur dessine chaque perle en SVG en utilisant `hex` (couleur principale) + `veinHex` (veining secondaire) + `shape` (forme 2D : `round`, `faceted`, `tube`, `nugget`, `cube`, `heart`, `star`, `flower`, `bow`).
- Les photos produits (vue catalogue, panier, fiche kit) sont des **PNG détourés** servis via `<Image>`.

**Conséquence pour ton admin :** tu n'utiliseras pas les modèles 3D que tu as déjà uploadés. Tu dois enrichir chaque charm/perle avec :

| Champ à ajouter | Type | Exemple | Obligatoire |
|---|---|---|---|
| `hex` | `string` (CSS hex) | `"#6B9B95"` | Oui (perles) |
| `veinHex` | `string` (CSS hex) | `"#4A7A74"` | Recommandé (perles) |
| `shape` | enum (cf. § 5) | `"nugget"` | Oui |
| `family` | enum (cf. § 5) | `"turquoise"` | Oui (perles) |
| `sizeMm` | `number` (mm) | `8` | Oui |
| `photos[]` | `string[]` (URLs HTTPS) | `["https://platform.garcapps.fr/uploads/beads/abc.png"]` | Oui à terme |

**Recommandation :** dans ton admin, ajoute un onglet "Métadonnées 2D" sur chaque charm/perle pour saisir ces champs. Les modèles 3D restent stockés mais ne sont pas exposés par l'API publique pour l'instant.

---

## 3. Mapping Admin ↔ Front (vocabulaire)

Ton admin et le front n'utilisent pas le même vocabulaire. Voici la correspondance :

| Dans ton admin | Devient côté front | Discriminateur |
|---|---|---|
| **Charm** avec forme `ronde / brute / cube / tube` | `Bead` (perle) | `kind` n'existe pas, c'est une perle classique |
| **Charm** avec forme `cœur / étoile / fleur / nœud` | `Bead` avec `family: "enamel"` et `shape: "heart" \| "star" \| "flower" \| "bow"` | Perle émaillée colorée — passe sur le fil |
| **Charm** métallique (lettres, médailles, lunes) | `Charm` avec `kind: "charm"` | Petit élément métallique entre les perles (atelier Classique) |
| **Charm** figurine 3D émaillée (Sanrio / Disney / signature) | `Charm` avec `kind: "figurine"` | Décoration latérale (atelier Kawaii). `licensed: "sanrio" \| "disney"` ⇒ `surcharge: 6 €` |
| **Base** | `BraceletBase` | Type de fil/chaîne (`elastique / cordon / chaine-dore / chaine-argent`) |
| *(nouveau)* | `Atelier` | Recette de bracelet (Bracelet Bar / Kawaii / Classique). Définit prix fixe + tailles + familles autorisées |
| *(nouveau)* | `Kit` | Coffret prêt-à-faire avec liste de perles/charms |
| *(nouveau)* | `Boutique` | Adresse physique (Marais, Montmartre) |

**À ajouter dans ton admin :**
- Onglet **Ateliers** (3 entrées : Bracelet Bar, Kawaii, Classique)
- Onglet **Kits** (avec composition : `beadId × quantity`, `charmId × quantity`)
- Onglet **Boutiques** (2 entrées)

Ces 3 nouvelles entités sont décrites en détail au § 6.

---

## 4. Conventions générales

### IDs
Chaînes (UUID ou slug stable). Le front ne les génère **jamais** pour des ressources serveur. Format recommandé : `bead_<slug>`, `charm_<slug>`, `base_<slug>`, `kit_<slug>`, `atelier_<slug>`, `boutique_<slug>`.

### Prix
Nombres en **euros** (pas en centimes). C'est le back qui convertit avant Stripe si besoin. Exemple : `price: 4.5` = 4,50 €.

### Dates
ISO 8601 UTC : `"2026-04-22T14:00:00Z"`.

### Images
URLs absolues HTTPS, idéalement servies par un CDN ou directement par `platform.garcapps.fr/uploads/...`. Le front utilise `next/image` ; tout domaine externe doit être ajouté à `next.config.ts` :

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'platform.garcapps.fr' },
  ],
}
```

### Stock
`number`. `0` = rupture. Le front l'affiche textuellement ("En stock", "Plus que X", "Rupture").

### Format d'erreur (toutes routes)
Réponse en cas d'erreur, n'importe quel code 4xx/5xx :
```json
{
  "error": "BEAD_NOT_FOUND",
  "message": "Aucune perle avec cet id",
  "details": { "id": "bead_inexistante" }
}
```

### Pagination
Pas requise pour le catalogue actuel (< 200 items). Si la liste dépasse 100 entrées un jour, ajouter `?page=1&limit=50` et inclure dans la réponse :
```json
{ "data": [...], "page": 1, "limit": 50, "total": 142 }
```

### CORS
Le front en prod tournera sur `mynicebracelet.com` (ou un sous-domaine). À configurer côté `platform.garcapps.fr` :
```
Access-Control-Allow-Origin: https://mynicebracelet.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Authentification
- **Catalogue (lecture)** : public, aucune auth requise.
- **Commandes** (`POST /api/orders`) : pour les invités, aucune auth ; le contact est fourni dans le payload. Pour les utilisateurs connectés (futur), Bearer JWT en header `Authorization: Bearer <token>`.
- **Designs sauvegardés** : pour les invités, stockage 100 % localStorage côté front (rien n'arrive au back). Pour les utilisateurs connectés (futur), Bearer JWT.

Tu n'as **pas besoin** d'implémenter l'auth tant que le système de comptes n'est pas livré. Démarre avec catalogue + orders invités.

---

## 5. Référentiels (enums)

Les valeurs autorisées pour les champs polymorphes. Source de vérité : `src/types/index.ts`.

```ts
StoneFamily =
  'amethyst' | 'turquoise' | 'rose-quartz' | 'lapis' | 'onyx' | 'jade'
  | 'amber' | 'pearl' | 'citrine' | 'obsidian' | 'carnelian'
  | 'moonstone' | 'garnet' | 'enamel'

BeadShape =
  'round' | 'faceted' | 'rondelle' | 'nugget' | 'tube' | 'cube'
  | 'heart' | 'star' | 'flower' | 'bow'

CharmCategory =
  'lettre' | 'coeur' | 'etoile' | 'animal' | 'kawaii'
  | 'symbole' | 'fleur' | 'lune' | 'noeud'

CharmMaterial = 'dore' | 'argente' | 'email' | 'pierre'
CharmKind     = 'charm' | 'figurine'
CharmLicense  = 'sanrio' | 'disney'

BraceletBaseType = 'elastique' | 'cordon' | 'chaine-dore' | 'chaine-argent'

KitCategory   = 'classique' | 'kawaii' | 'kawaii-premium'
SizeLabel     = 'S' | 'M' | 'L' | 'custom'
```

Si tu ajoutes une valeur (nouveau matériau, nouvelle catégorie), **préviens le front** : il faut mettre à jour le type TS et le rendu correspondant.

---

## 6. Endpoints catalogue

### Tableau récap

| Fonction front | Méthode + URL | Réponse |
|---|---|---|
| `listBeads()` | `GET /api/beads` | `Bead[]` |
| `getBead(id)` | `GET /api/beads/:id` | `Bead` ou 404 |
| `listCharms()` | `GET /api/charms` | `Charm[]` |
| `getCharm(id)` | `GET /api/charms/:id` | `Charm` ou 404 |
| `listBases()` | `GET /api/bases` | `BraceletBase[]` |
| `getBase(id)` | `GET /api/bases/:id` | `BraceletBase` ou 404 |
| `listAteliers()` | `GET /api/ateliers` | `Atelier[]` |
| `getAtelier(id)` | `GET /api/ateliers/:id` | `Atelier` ou 404 |
| `getAtelierBySlug(slug)` | `GET /api/ateliers/slug/:slug` | `Atelier` ou 404 |
| `listKits(?featured=1)` | `GET /api/kits[?featured=1]` | `Kit[]` |
| `getKit(id)` | `GET /api/kits/:id` | `Kit` ou 404 |
| `getKitBySlug(slug)` | `GET /api/kits/slug/:slug` | `Kit` ou 404 |
| `listBoutiques()` | `GET /api/boutiques` | `Boutique[]` |

### 6.1 — Bead (perle)

```http
GET /api/beads
```
```json
[
  {
    "id": "bead_turquoise_8",
    "name": "Turquoise brute",
    "family": "turquoise",
    "hex": "#6B9B95",
    "veinHex": "#4A7A74",
    "shape": "nugget",
    "sizeMm": 8,
    "price": 2.8,
    "stock": 80,
    "description": "Éclat bleu-vert minéral, chaque perle est unique.",
    "meaning": ["protection", "voyage"],
    "images": [
      "https://platform.garcapps.fr/uploads/beads/bead_turquoise_8.png"
    ]
  },
  {
    "id": "bead_heart_black",
    "name": "Cœur émaillé noir",
    "family": "enamel",
    "hex": "#1A1A1A",
    "shape": "heart",
    "sizeMm": 10,
    "price": 3.5,
    "stock": 200,
    "description": "Cœur noir brillant, signature graphique.",
    "images": ["https://platform.garcapps.fr/uploads/beads/bead_heart_black.png"]
  }
]
```

**Champs critiques :**
- `hex` **obligatoire** — le configurateur 2D en dépend.
- `veinHex` optionnel mais améliore le rendu.
- `shape` conditionne le SVG (rendus spécifiques pour `faceted`, `tube`, `nugget`, `heart`, `star`, etc.).
- `sizeMm` — diamètre mesuré en mm. La somme des `sizeMm` des composants = circonférence du bracelet (l'atelier impose un budget de longueur). Pour les formes non rondes, c'est la **projection horizontale** quand le trou est orienté nord-sud.
- `meaning` — symbolisme, sert au filtrage et au storytelling.

### 6.2 — Charm

```http
GET /api/charms
```
```json
[
  {
    "id": "charm_lettre_a",
    "name": "Lettre A dorée",
    "category": "lettre",
    "material": "dore",
    "kind": "charm",
    "sizeMm": 6,
    "price": 4.5,
    "stock": 50,
    "description": "Initiale en laiton doré à l'or fin.",
    "images": ["https://platform.garcapps.fr/uploads/charms/charm_lettre_a.png"]
  },
  {
    "id": "charm_figurine_hello_kitty",
    "name": "Hello Kitty",
    "category": "kawaii",
    "material": "email",
    "kind": "figurine",
    "sizeMm": 14,
    "price": 4.5,
    "stock": 25,
    "description": "Figurine émaillée Sanrio officielle.",
    "images": ["https://platform.garcapps.fr/uploads/figurines/hk.png"],
    "licensed": "sanrio",
    "surcharge": 6
  }
]
```

**Champs critiques :**
- `category` conditionne la forme SVG placeholder. Ne pas créer de nouvelle catégorie sans prévenir le front.
- `material` influence la couleur de fallback (doré / argenté / émail / pierre).
- `kind` discrimine `charm` (atelier Classique, sur le fil) vs `figurine` (atelier Kawaii, décoration latérale).
- `licensed` + `surcharge` : appliqués uniquement aux figurines licenciées (Sanrio / Disney). Surcharge de 6 € à ajouter au total bracelet (le front l'affiche, le back doit le valider).

### 6.3 — BraceletBase

```http
GET /api/bases
```
```json
[
  {
    "id": "base_elastique",
    "type": "elastique",
    "name": "Élastique tressé",
    "description": "Fil élastique durable, tressé à la main. Parfait pour les créations multi-perles sans fermoir.",
    "price": 0,
    "beadSlots": { "small": 20, "medium": 22, "large": 24 },
    "sizes": [
      { "label": "S", "cm": 15 },
      { "label": "M", "cm": 17 },
      { "label": "L", "cm": 19 }
    ],
    "images": ["https://platform.garcapps.fr/uploads/bases/elastique.png"]
  },
  {
    "id": "base_chaine_dore",
    "type": "chaine-dore",
    "name": "Chaîne dorée",
    "description": "Chaîne laiton doré à l'or fin, fermoir mousqueton.",
    "price": 18,
    "beadSlots": { "small": 8, "medium": 10, "large": 12 },
    "sizes": [
      { "label": "S", "cm": 16 },
      { "label": "M", "cm": 18 },
      { "label": "L", "cm": 20 }
    ],
    "images": ["https://platform.garcapps.fr/uploads/bases/chaine_dore.png"]
  }
]
```

> **Note** : ton admin actuel stocke aussi une config JSON 3D (`shape`, `line_radius`, `line_length`, `line_y`, `pick_radius`). **Cette config n'est PAS exposée par l'API publique** — elle reste interne pour ton outil de visualisation 3D. L'API ne renvoie que les champs ci-dessus.

### 6.4 — Atelier

Une **recette** de bracelet : prix fixe, tailles autorisées, familles de perles compatibles, règles de longueur. Trois ateliers en production :

```http
GET /api/ateliers
```
```json
[
  {
    "id": "atelier_bracelet_bar",
    "slug": "bracelet-bar",
    "name": "Bracelet Bar",
    "tagline": "Perles & nacre — l'entrée de gamme",
    "description": "Composez votre bracelet à partir de perles pastel et nacrées, sans pierres semi-précieuses.",
    "image": "https://platform.garcapps.fr/uploads/ateliers/bar.jpg",
    "wireType": "Fil élastique",
    "sizing": { "mode": "user-pick" },
    "allowedBeadFamilies": ["pearl", "rose-quartz", "turquoise", "moonstone", "amber", "amethyst", "enamel"],
    "allowedCharmCategories": [],
    "allowCharms": false,
    "maxCharms": 0,
    "slackMm": 2,
    "price": 18,
    "sizes": [
      { "label": "S", "cm": 15 },
      { "label": "M", "cm": 17 },
      { "label": "L", "cm": 19 }
    ]
  },
  {
    "id": "atelier_kawaii",
    "slug": "kawaii",
    "name": "Kawaii",
    "tagline": "Perles pastel + figurine signature",
    "description": "Fil de fer mémoire, figurine décorative latérale (Sanrio / Disney / signature MNB).",
    "image": "https://platform.garcapps.fr/uploads/ateliers/kawaii.jpg",
    "wireType": "Fil de fer mémoire",
    "sizing": { "mode": "fixed-range", "minMm": 290, "maxMm": 330 },
    "allowedBeadFamilies": ["pearl", "rose-quartz", "turquoise", "moonstone", "amber", "amethyst", "enamel"],
    "allowedCharmCategories": ["kawaii", "fleur", "coeur", "etoile", "noeud", "animal"],
    "allowCharms": true,
    "maxCharms": 1,
    "slackMm": 0,
    "price": 28,
    "sizes": []
  },
  {
    "id": "atelier_classique",
    "slug": "classique",
    "name": "Classique",
    "tagline": "Toutes pierres + tous charms",
    "description": "La collection complète : pierres semi-précieuses, charms métalliques, lettres et symboles.",
    "image": "https://platform.garcapps.fr/uploads/ateliers/classique.jpg",
    "wireType": "Fil élastique",
    "sizing": { "mode": "user-pick" },
    "allowedBeadFamilies": ["amethyst", "turquoise", "rose-quartz", "lapis", "onyx", "jade", "amber", "pearl", "citrine", "obsidian", "carnelian", "moonstone", "garnet", "enamel"],
    "allowedCharmCategories": ["lettre", "symbole", "lune"],
    "allowCharms": true,
    "maxCharms": 3,
    "slackMm": 2,
    "price": 36,
    "sizes": [
      { "label": "S", "cm": 15 },
      { "label": "M", "cm": 17 },
      { "label": "L", "cm": 19 }
    ]
  }
]
```

**Champs critiques :**
- `sizing.mode` :
  - `"user-pick"` ⇒ l'utilisateur choisit S/M/L/custom. Total `sizeMm` des composants = `sizeCm × 10` (± `slackMm`).
  - `"fixed-range"` ⇒ pas de choix de taille, total `sizeMm` doit rester dans `[minMm, maxMm]`.
- `allowedBeadFamilies` / `allowedCharmCategories` filtrent les pickers.
- `maxCharms` borne le nombre de charms (sur le fil pour Classique, en figurine pour Kawaii).
- `price` = prix fixe payé pour cet atelier, **indépendant** du nombre de perles. Le coût des perles individuelles n'est pas répercuté à l'utilisateur ici (c'est le modèle "atelier in-store").

### 6.5 — Kit

Coffret prêt-à-faire avec composition fixe.

```http
GET /api/kits?featured=1
```
```json
[
  {
    "id": "kit_jardin",
    "slug": "kit-jardin-parisien",
    "name": "Jardin Parisien",
    "tagline": "Vert tendre, quartz rose et dorures",
    "description": "Inspiré des jardins du Palais-Royal au printemps.",
    "longDescription": "Chaque kit contient le matériel exact pour composer 1 bracelet : un fil élastique de qualité supérieure, 30 perles 6 mm assorties (jade, quartz rose, perles nacrées), 2 charms dorés et une notice illustrée.",
    "category": "classique",
    "price": 36,
    "palette": ["#7A9B6E", "#D4A8A0", "#EDE4D3", "#B8935A"],
    "beads": [
      { "beadId": "bead_jade_6", "quantity": 10 },
      { "beadId": "bead_rose_quartz_6", "quantity": 10 },
      { "beadId": "bead_pearl_6", "quantity": 10 }
    ],
    "charms": [
      { "charmId": "charm_flower_daisy", "quantity": 1 },
      { "charmId": "charm_heart_gold", "quantity": 1 }
    ],
    "baseType": "elastique",
    "tags": ["Printemps", "Best-seller"],
    "difficulty": "debutant",
    "makeTime": "30 min",
    "numberOfBracelets": 1,
    "images": ["https://platform.garcapps.fr/uploads/kits/jardin.jpg"],
    "featured": true,
    "stock": 48
  }
]
```

**Référentiel des prix kits (source de vérité, ne pas dériver côté back) :**

| Catégorie | Solo (1 bracelet) | Duo (2 bracelets) |
|---|---|---|
| `classique` | 36 € | 65 € |
| `kawaii-premium` | 30 € | 55 € |
| `kawaii` | 24 € | 44 € |

**Champs critiques :**
- `palette` (4 hex) — utilisé pour les placeholders en attendant les photos kit. À remplir même si la photo existe (utilisé aussi dans le panier).
- `beads[]` et `charms[]` — composition exacte. Les `beadId` / `charmId` doivent exister dans les autres tables (intégrité référentielle côté back).
- `slug` unique.

### 6.6 — Boutique

```http
GET /api/boutiques
```
```json
[
  {
    "id": "boutique_marais",
    "name": "MyNiceBracelet — Le Marais",
    "address": "12 rue des Rosiers",
    "postalCode": "75004",
    "city": "Paris",
    "phone": "+33 1 23 45 67 89",
    "hours": [
      { "day": "Lundi", "open": "11:00", "close": "19:00" },
      { "day": "Mardi", "open": "11:00", "close": "19:00" },
      { "day": "Dimanche", "open": "", "close": "", "closed": true }
    ],
    "mapsUrl": "https://maps.google.com/?q=...",
    "bookingUrl": "https://calendly.com/mnb-marais",
    "image": "https://platform.garcapps.fr/uploads/boutiques/marais.jpg"
  }
]
```

---

## 7. Endpoints checkout (mutations)

### 7.1 — Créer une commande

```http
POST /api/orders
Content-Type: application/json
```
```json
{
  "lines": [
    {
      "lineId": "tmp_1",
      "kind": "kit",
      "kitId": "kit_jardin",
      "quantity": 1
    },
    {
      "lineId": "tmp_2",
      "kind": "custom",
      "config": {
        "id": "tmp_design_xyz",
        "atelierId": "atelier_classique",
        "sizeLabel": "M",
        "sizeCm": 17,
        "components": [
          { "slotId": "s_1", "kind": "bead",  "refId": "bead_turquoise_8" },
          { "slotId": "s_2", "kind": "bead",  "refId": "bead_pearl_6" },
          { "slotId": "s_3", "kind": "charm", "refId": "charm_lune_dore" }
        ],
        "figurine": null,
        "createdAt": "2026-05-06T10:00:00Z",
        "updatedAt": "2026-05-06T10:05:00Z",
        "price": 36
      },
      "quantity": 1
    }
  ],
  "shipping": {
    "firstName": "Camille",
    "lastName":  "Durand",
    "line1":     "5 rue Oberkampf",
    "line2":     "",
    "postalCode":"75011",
    "city":      "Paris",
    "country":   "FR"
  },
  "contact": {
    "email": "camille@example.com",
    "phone": "+33 6 12 34 56 78"
  }
}
```

**Réponse 200 :**
```json
{
  "orderId": "ord_2026_05_06_001",
  "paymentSessionUrl": "https://checkout.stripe.com/c/pay/cs_..."
}
```

**Comportement attendu côté back :**
1. Valider l'intégrité référentielle (`kitId`, `atelierId`, `beadId`, `charmId` existent et `stock > 0`).
2. Recalculer le total **autoritativement** (le front envoie ses prix mais on ne lui fait pas confiance) : kits via `KIT_PRICES`, customs via `atelier.price + Σ surcharges figurines licenciées`.
3. Appliquer la règle d'expédition : offerte ≥ 60 €, sinon `4,90 €`.
4. **Réserver** le stock (transaction atomique) — pas encore décrémenter, c'est le webhook Stripe qui valide.
5. Créer une session Stripe Checkout, renvoyer l'URL.
6. À la réception du webhook `checkout.session.completed` : décrémenter le stock définitivement et marquer la commande `paid`.

### 7.2 — Sauvegarder un design (utilisateurs connectés)

```http
POST /api/designs
Authorization: Bearer <jwt>
```
```json
{
  "atelierId": "atelier_classique",
  "sizeLabel": "M",
  "sizeCm": 17,
  "components": [...],
  "figurine": null,
  "title": "Mon bracelet anniversaire"
}
```

**Réponse 201 :** `{ "id": "design_abc", "createdAt": "2026-05-06T10:00:00Z" }`

```http
GET /api/designs
Authorization: Bearer <jwt>
```
**Réponse 200 :** `BraceletConfig[]`

> **Pour l'instant** : tant que l'auth n'est pas livrée, ces endpoints ne sont pas appelés — le front sauvegarde tout en localStorage côté client (max 24 designs).

---

## 8. Calculs faits par le front (à re-vérifier côté back)

Le front affiche ces valeurs en temps réel mais elles **ne sont pas autoritatives**. Le back doit les recalculer au checkout :

- **Prix d'un bracelet personnalisé** = `atelier.price + Σ figurine.surcharge` (les perles individuelles sont incluses dans le prix atelier).
- **Frais de livraison** = `0` si sous-total ≥ 60 €, sinon `4.90`.
- **Sous-total panier** = `Σ (line.price × line.quantity)`.

Si tes calculs diffèrent, l'API renvoie le total recalculé dans la réponse Stripe et le front affiche celui-là.

---

## 9. Stockage des images

### Convention

- Toutes les URLs renvoyées par l'API sont **HTTPS absolues**.
- Domaine recommandé : `https://platform.garcapps.fr/uploads/...`
- Sous-dossiers suggérés :
  ```
  /uploads/beads/<id>.png
  /uploads/charms/<id>.png
  /uploads/figurines/<id>.png
  /uploads/bases/<id>.png
  /uploads/ateliers/<id>.jpg
  /uploads/kits/<id>.jpg
  /uploads/boutiques/<id>.jpg
  ```
- Format perles / charms : **PNG transparent détouré** (le configurateur compose les éléments sur fond beige).
- Format kits / ateliers / boutiques : JPG ou WebP haute qualité.
- Résolution recommandée : 800 × 800 minimum, 2× pour le retina.

### CORS pour les images

Le front passe par `next/image`, qui charge les images en proxy. Si tu héberges sur `platform.garcapps.fr`, ajoute :
```
Access-Control-Allow-Origin: https://mynicebracelet.com
```
sur les réponses `/uploads/*`.

---

## 10. Versioning

Si l'API évolue de manière cassante, préfixe les URLs : `/api/v2/...`. Le front exporte une constante `API_VERSION` à ajouter dans `src/lib/api/index.ts` le moment venu.

---

## 11. Plan de migration recommandé

Étapes ordonnées pour passer de "front 100 % mocké" à "front branché sur ton API". Tu peux faire un sprint par étape :

### Étape 1 — Catalogue lecture seule (priorité 1)
1. Enrichir le schéma SQL admin : ajouter `hex`, `veinHex`, `shape`, `family`, `sizeMm`, `kind`, `material`, `category`, `description`, `meaning[]`, `price`, `stock` sur les charms.
2. Créer table `bases` enrichie + tables `ateliers`, `kits`, `boutiques`.
3. Migrer les 55 charms existants vers le nouveau schéma (script de migration ; les valeurs `hex` peuvent être saisies manuellement dans l'admin ou extraites de l'albedo).
4. Implémenter les endpoints `GET /api/beads`, `/api/charms`, `/api/bases`, `/api/ateliers`, `/api/kits`, `/api/boutiques`.
5. Configurer CORS pour `mynicebracelet.com`.
6. Brancher : remplacer le contenu de `src/lib/api/index.ts` par des `fetch()` + `process.env.NEXT_PUBLIC_API_URL`.

### Étape 2 — Checkout invité (priorité 2)
1. Créer la table `orders` + `order_items`.
2. Implémenter `POST /api/orders` (validation + Stripe Checkout).
3. Implémenter le webhook Stripe `checkout.session.completed`.
4. Brancher dans le front : `src/app/(checkout)/commande/CheckoutClient.tsx` (formulaire RHF + Zod déjà prêt).

### Étape 3 — Comptes utilisateurs (priorité 3, optionnel)
1. Endpoint `/api/auth/session`.
2. Tables `users`, `designs`.
3. Endpoints `POST /api/designs`, `GET /api/designs`.
4. Bascule du store `useConfigurator.savedDesigns` de localStorage vers serveur.

---

## 12. Checklist d'intégration

À cocher avant de considérer l'intégration "live" :

- [ ] Tous les endpoints `GET` du § 6 répondent en JSON valide
- [ ] Les `id` retournés sont stables (un re-deploy ne casse pas les liens existants)
- [ ] Les images sont en HTTPS et chargent depuis le navigateur sans erreur CORS
- [ ] `next.config.ts > images.remotePatterns` inclut le domaine de stockage
- [ ] `npm run typecheck` passe côté front avec les vraies données (pas de champ obligatoire manquant)
- [ ] Le configurateur `/creer` fonctionne avec les vraies données (perles affichées avec leur `hex`, formes correctes)
- [ ] Une commande test passe de bout en bout (`POST /api/orders` → Stripe sandbox → webhook → stock décrémenté)
- [ ] Un test de charge basique sur `/api/beads` (100 req/sec) ne fait pas tomber l'admin

---

## 13. Source de vérité des types

Tous les types TypeScript sont dans **[`src/types/index.ts`](./src/types/index.ts)**. Si tu utilises un IDE avec auto-complétion (VS Code, Cursor), ouvre ce fichier en parallèle de ton implémentation back — c'est le contrat que tu dois respecter.

Si tu utilises Claude pour générer le code back-end :
1. Donne-lui ce fichier `API_CONTRACT.md` en contexte.
2. Donne-lui aussi `src/types/index.ts`.
3. Pour chaque endpoint, demande-lui le code dans **ton stack** (PHP/Symfony, Node/Express, etc.) en respectant le format JSON exact des exemples ci-dessus.

---

## 14. Contact

Questions d'intégration : ouvrir une issue sur `thibehappy/mnb-ecommerce` ou contacter Dany directement.
