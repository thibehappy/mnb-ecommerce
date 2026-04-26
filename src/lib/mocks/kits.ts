import type { Kit } from '@/types';

/**
 * 3-tier pricing :
 *   - classique         : 36 € solo / 65 € duo
 *   - kawaii-premium    : 30 € solo / 55 € duo (figurines Sanrio + Disney incluses)
 *   - kawaii            : 24 € solo / 44 € duo
 */
export const KITS: Kit[] = [
  {
    id: 'kit_jardin',
    slug: 'kit-jardin-parisien',
    name: 'Jardin Parisien',
    tagline: 'Vert tendre, quartz rose et dorures',
    description:
      'Un kit inspiré des jardins du Palais-Royal au printemps. Jade, quartz rose, marguerites émaillées.',
    longDescription:
      'Chaque kit contient le matériel exact pour composer 1 bracelet : un fil élastique de qualité supérieure, une sélection de 30 perles 6mm assorties (jade vert, quartz rose, perles nacrées), 2 charms dorés dont une marguerite émaillée, et une notice illustrée. Rangé dans un coffret en carton recyclé estampillé MyNiceBracelet.',
    category: 'classique',
    price: 36,
    palette: ['#7A9B6E', '#D4A8A0', '#EDE4D3', '#B8935A'],
    beads: [
      { beadId: 'bead_jade_6', quantity: 10 },
      { beadId: 'bead_rose_quartz_6', quantity: 10 },
      { beadId: 'bead_pearl_6', quantity: 10 },
    ],
    charms: [
      { charmId: 'charm_flower_daisy', quantity: 1 },
      { charmId: 'charm_heart_gold', quantity: 1 },
    ],
    baseType: 'elastique',
    tags: ['Printemps', 'Best-seller'],
    difficulty: 'debutant',
    makeTime: '30 min',
    numberOfBracelets: 1,
    images: [],
    featured: true,
    stock: 48,
  },
  {
    id: 'kit_nuit',
    slug: 'kit-nuit-etoilee',
    name: 'Nuit Étoilée',
    tagline: 'Onyx, lapis-lazuli et charms lunaires',
    description:
      'Nuances profondes pour une allure élégante. Onyx noir, lapis bleu nuit, charms lune et étoile.',
    longDescription:
      'Pour les amateurs de pierres sombres et de symboles célestes. Comprend 30 perles assorties (onyx, lapis-lazuli, pierre de lune), 3 charms dorés (lune, étoile, infini) et le fil élastique.',
    category: 'classique',
    price: 36,
    palette: ['#1A1A1A', '#3B5A7A', '#DCD4CC', '#B8935A'],
    beads: [
      { beadId: 'bead_onyx_6', quantity: 12 },
      { beadId: 'bead_lapis_6', quantity: 10 },
      { beadId: 'bead_moonstone_6', quantity: 8 },
    ],
    charms: [
      { charmId: 'charm_moon_gold', quantity: 1 },
      { charmId: 'charm_star_gold', quantity: 1 },
      { charmId: 'charm_infinity', quantity: 1 },
    ],
    baseType: 'elastique',
    tags: ['Automne', 'Élégant'],
    difficulty: 'debutant',
    makeTime: '35 min',
    numberOfBracelets: 1,
    images: [],
    featured: true,
    stock: 32,
  },
  {
    id: 'kit_kawaii',
    slug: 'kit-kawaii-party',
    name: 'Kawaii Party',
    tagline: 'La signature colorée MyNiceBracelet',
    description:
      'Le kit préféré des ateliers enfants. Charms panda, nuage et étoile souriante sur perles pastel.',
    longDescription:
      'Conçu pour les plus jeunes (et les grands qui aiment). 30 perles pastel assorties, 4 charms kawaii émaillés, et une notice illustrée adaptée. Fil de fer mémoire, passe au poignet sans fermoir.',
    category: 'kawaii',
    price: 24,
    palette: ['#D4A8A0', '#F5EFE3', '#7CADA6', '#D4A855'],
    beads: [
      { beadId: 'bead_rose_quartz_6', quantity: 10 },
      { beadId: 'bead_pearl_6', quantity: 10 },
      { beadId: 'bead_turquoise_6', quantity: 10 },
    ],
    charms: [
      { charmId: 'charm_kawaii_panda', quantity: 1 },
      { charmId: 'charm_kawaii_cloud', quantity: 1 },
      { charmId: 'charm_kawaii_star_smile', quantity: 2 },
    ],
    baseType: 'elastique',
    tags: ['Enfants', 'Pastel'],
    difficulty: 'debutant',
    makeTime: '25 min',
    numberOfBracelets: 1,
    images: [],
    featured: true,
    stock: 60,
  },
  {
    id: 'kit_sanrio',
    slug: 'kit-sanrio-friends',
    name: 'Sanrio & Friends',
    tagline: 'Hello Kitty, Cinnamoroll & co. en figurines premium',
    description:
      'Charms officiels Sanrio en relief émaillé, sur perles pastel haut de gamme.',
    longDescription:
      'La collection kawaii premium MyNiceBracelet. 30 perles pastel haut de gamme et 3 figurines officielles Sanrio (Hello Kitty, Cinnamoroll, My Melody) en émail relief. Fil de fer mémoire, écrin nominatif.',
    category: 'kawaii-premium',
    price: 30,
    palette: ['#F5C9D4', '#FFFFFF', '#D4A8A0', '#A8BED4'],
    beads: [
      { beadId: 'bead_rose_quartz_6', quantity: 12 },
      { beadId: 'bead_pearl_6', quantity: 12 },
      { beadId: 'bead_moonstone_6', quantity: 6 },
    ],
    charms: [
      { charmId: 'charm_kawaii_panda', quantity: 1 },
      { charmId: 'charm_kawaii_cloud', quantity: 1 },
      { charmId: 'charm_flower_cherry', quantity: 1 },
    ],
    baseType: 'elastique',
    tags: ['Cadeau', 'Best-seller'],
    difficulty: 'debutant',
    makeTime: '30 min',
    numberOfBracelets: 1,
    images: [],
    featured: true,
    stock: 24,
  },
  {
    id: 'kit_disney',
    slug: 'kit-disney-magic',
    name: 'Disney Magic',
    tagline: 'Mickey, Stitch et la troupe Disney',
    description:
      'Figurines Disney officielles en émail, perles dorées et charms étoilés.',
    longDescription:
      'Trois figurines Disney officielles (Mickey, Stitch, Marie) en émail relief, 30 perles dorées et nacre, deux charms étoile. Fil de fer mémoire, livré dans un écrin nominatif.',
    category: 'kawaii-premium',
    price: 30,
    palette: ['#1A1A1A', '#D4A855', '#F5EFE3', '#A4473E'],
    beads: [
      { beadId: 'bead_pearl_6', quantity: 12 },
      { beadId: 'bead_onyx_6', quantity: 8 },
      { beadId: 'bead_citrine_6', quantity: 10 },
    ],
    charms: [
      { charmId: 'charm_kawaii_panda', quantity: 1 },
      { charmId: 'charm_star_gold', quantity: 2 },
    ],
    baseType: 'elastique',
    tags: ['Cadeau'],
    difficulty: 'debutant',
    makeTime: '30 min',
    numberOfBracelets: 1,
    images: [],
    featured: false,
    stock: 18,
  },
  {
    id: 'kit_solaire',
    slug: 'kit-solaire',
    name: 'Solaire',
    tagline: 'Ambre, citrine et terre cuite',
    description:
      'Tons chauds d’été. Ambre, citrine et cornaline pour une composition lumineuse.',
    longDescription:
      'Une célébration du soleil. 30 perles dans des teintes dorées, miel et terre cuite, 2 charms (abeille et soleil).',
    category: 'classique',
    price: 36,
    palette: ['#B8823C', '#D4A855', '#B85A3C', '#B8935A'],
    beads: [
      { beadId: 'bead_amber_8', quantity: 8 },
      { beadId: 'bead_citrine_6', quantity: 10 },
      { beadId: 'bead_carnelian_6', quantity: 10 },
    ],
    charms: [
      { charmId: 'charm_bee', quantity: 1 },
      { charmId: 'charm_star_gold', quantity: 1 },
    ],
    baseType: 'elastique',
    tags: ['Été', 'Chaleureux'],
    difficulty: 'intermediaire',
    makeTime: '40 min',
    numberOfBracelets: 1,
    images: [],
    featured: false,
    stock: 28,
  },
  {
    id: 'kit_duo_amitie',
    slug: 'kit-duo-amitie',
    name: 'Duo Amitié',
    tagline: 'Deux bracelets classiques pour deux',
    description:
      'À offrir ou à partager. Deux créations classiques assorties, quartz rose et perle nacrée.',
    longDescription:
      'Le kit parfait pour célébrer un lien. Deux palettes complémentaires sur fil élastique, charms cœurs dorés assortis, notice doublée. Économie de 7 € versus 2 kits Solo classiques achetés séparément.',
    category: 'classique',
    price: 65,
    palette: ['#D4A8A0', '#EDE4D3', '#B8935A', '#8B6F9B'],
    beads: [
      { beadId: 'bead_rose_quartz_6', quantity: 12 },
      { beadId: 'bead_pearl_6', quantity: 12 },
      { beadId: 'bead_amethyst_6', quantity: 8 },
    ],
    charms: [
      { charmId: 'charm_heart_gold', quantity: 2 },
      { charmId: 'charm_infinity', quantity: 2 },
    ],
    baseType: 'elastique',
    tags: ['Cadeau', 'Saint-Valentin'],
    difficulty: 'debutant',
    makeTime: '30 min',
    numberOfBracelets: 2,
    images: [],
    featured: false,
    stock: 40,
  },
  {
    id: 'kit_duo_kawaii',
    slug: 'kit-duo-pastel',
    name: 'Duo Pastel',
    tagline: 'Deux bracelets kawaii à partager',
    description:
      'Deux Kawaii Party assortis, charms panda et nuage à se partager.',
    longDescription:
      'Pour offrir à deux meilleures amies, sœurs, ou parent-enfant. Deux palettes pastel coordonnées, 4 charms kawaii (2 pandas, 2 nuages). Économie de 4 € versus 2 kits Kawaii achetés séparément.',
    category: 'kawaii',
    price: 44,
    palette: ['#D4A8A0', '#F5EFE3', '#7CADA6', '#A8BED4'],
    beads: [
      { beadId: 'bead_rose_quartz_6', quantity: 14 },
      { beadId: 'bead_pearl_6', quantity: 14 },
      { beadId: 'bead_turquoise_6', quantity: 10 },
    ],
    charms: [
      { charmId: 'charm_kawaii_panda', quantity: 2 },
      { charmId: 'charm_kawaii_cloud', quantity: 2 },
    ],
    baseType: 'elastique',
    tags: ['Cadeau', 'Enfants'],
    difficulty: 'debutant',
    makeTime: '40 min',
    numberOfBracelets: 2,
    images: [],
    featured: false,
    stock: 30,
  },
];

export const KIT_BY_SLUG = Object.fromEntries(KITS.map((k) => [k.slug, k])) as Record<string, Kit>;
export const KIT_BY_ID = Object.fromEntries(KITS.map((k) => [k.id, k])) as Record<string, Kit>;
