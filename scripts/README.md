# Scripts

Petits utilitaires pour intégrer les photos produits.

## Workflow recommandé : ajouter des photos de perles en lot

### Cas A — Tu as déjà détouré tes PNG (transparent background)

1. **Nomme chaque PNG avec l'`id` de la perle** dans `src/lib/mocks/beads.ts`.
   Exemples :
   - `bead_amethyst_6.png`
   - `bead_jade_6.png`
   - `bead_garnet_6.png`
2. **Dépose-les dans** `public/photos/beads/`.
3. **Lance** :
   ```bash
   npm run sync:beads
   ```
4. Le script génère `src/lib/mocks/bead-photos.generated.ts` qui mappe chaque
   `id` à son URL `/photos/beads/<filename>`. Le mock `beads.ts` merge
   automatiquement ces URL dans le champ `images` de chaque entrée.
5. Relance le serveur Next (`npm run dev`) — les perles avec photo s'affichent
   à la place du SVG stylisé, sur la palette **et** sur le bracelet.

Si un PNG n'a pas d'`id` correspondant dans `beads.ts`, le script l'affiche en
warning et le saute. Soit tu renommes, soit tu ajoutes l'entrée au mock puis tu
relances.

### Cas B — Tu as une JPG avec fond blanc, à détourer

```bash
npm run detour:bead -- "C:/path/IMG_4438.JPG" "public/photos/beads/bead_amethyst_6.png"
```

Le script utilise `rembg` (modèle U²Net) pour retirer le fond, crop sur le sujet,
pad carré transparent, output PNG ≤ 1500×1500.

Puis lance `npm run sync:beads` comme dans le cas A.

## Liste des `bead_id` disponibles

Voir `src/lib/mocks/beads.ts` (chaque entrée commence par `id: '...'`).

Liste rapide actuellement :

```
bead_amethyst_6        bead_amber_8
bead_amethyst_facette  bead_pearl_6
bead_turquoise_8       bead_pearl_8_baroque
bead_turquoise_6       bead_pearl_4
bead_rose_quartz_6     bead_citrine_6
bead_rose_quartz_8     bead_obsidian_8
bead_lapis_6           bead_carnelian_6
bead_onyx_6            bead_moonstone_6
bead_onyx_8_facette    bead_onyx_4
bead_jade_6            bead_gold_tube
bead_garnet_6  ✓ (already done — used as reference)
```

Si tu shootes une perle qui n'existe pas dans le mock, ajoute-la d'abord dans
`beads.ts` avec un id en `bead_xxx_yyy` puis relance le sync.

## Mêmes principes pour les charms (à venir)

Si tu shootes les charms aussi : on peut dupliquer ce workflow avec
`public/photos/charms/` + `scripts/sync_charms.py`. Dis-le-moi.
