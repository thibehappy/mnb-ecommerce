import type { Lang } from './store';

/**
 * Translation dictionaries — FR is the source of truth, EN is the
 * translation. Keys are organised by feature area so you can spot
 * gaps at a glance.
 *
 * Editorial content (atelier descriptions, bead names, taglines from
 * mocks) is intentionally NOT translated here — those live in the
 * mocks files and are still in French. When the back-end ships a real
 * CMS we'll wire the locale to the API.
 */
type Dict = Record<string, string>;

const FR: Dict = {
  // Header
  'header.home': 'Accueil',
  'header.ateliers': 'Ateliers',
  'header.events': 'Événements',
  'header.faq': 'FAQ',
  'header.parisBoutique': 'Paris Boutique',
  'header.cart': 'Panier',
  'header.menu': 'Menu',
  'header.closeMenu': 'Fermer le menu',
  'header.backToShop': 'Retour à la boutique',

  // Atelier selection
  'atelierSelect.eyebrow': 'Étape 1 sur 3',
  'atelierSelect.title.line1': 'Quel atelier',
  'atelierSelect.title.line2': 'choisissez-vous ?',
  'atelierSelect.choose': 'Choisir →',
  'atelierSelect.haveGiftCode': 'J’ai un code cadeau',

  // Atelier names — kept as-is for brand consistency, but optional aliases
  'atelier.bracelet_bar.short': 'Essentiel',
  'atelier.kawaii.short': 'Kawaii',
  'atelier.classique.short': 'Classique',

  // Configurator — top bar
  'configurator.changeAtelier': 'Changer d’atelier',
  'configurator.universe': 'Univers',

  // Configurator — gift redemption banner
  'gift.banner.toValidate': 'Cadeau à valider',
  'gift.banner.toCompose': 'Cadeau à composer',
  'gift.banner.from': 'de la part de',
  'gift.banner.tweakDesigned': 'Vous pouvez ajuster ce bracelet ou valider tel quel.',
  'gift.banner.composeOpen': 'Composez votre bracelet — il vous est offert.',
  'gift.banner.exit': 'Quitter le mode cadeau',

  // Configurator — size
  'size.perso': 'Perso.',
  'size.confirm': 'Valider',
  'size.decrease': 'Réduire la taille de 0,5 cm',
  'size.increase': 'Augmenter la taille de 0,5 cm',

  // Configurator — bracelet stage
  'configurator.empty': 'Glissez une perle pour commencer',
  'configurator.zoomIn': 'Zoomer',
  'configurator.zoomOut': 'Dézoomer',
  'configurator.zoomReset': 'Zoom 100 %',
  'configurator.restart': 'Recommencer',
  'configurator.reorganize': 'Réorganiser',
  'configurator.remove': 'Retirer',

  // Tabs / palette
  'tabs.beads': 'Perles',
  'tabs.charms': 'Charms',
  'tabs.figurines': 'Figurines',

  // Action row
  'action.share': 'Partager',
  'action.linkCopied': 'Lien copié',
  'action.shareOpen': 'Partage ouvert',
  'action.shareCancelled': 'Partage annulé',
  'action.gift': 'Offrir',
  'action.addToCart': 'Ajouter au panier',
  'action.added': 'Ajouté',
  'action.confirmGift': 'Confirmer ce cadeau',
  'action.confirmed': 'Confirmé',
  'action.offered': 'Offert',

  // Fit messages
  'fit.empty': 'Ajoutez vos premières perles pour composer le bracelet',
  'fit.ready': 'Ajustement parfait',
  'fit.tooLong': 'Trop long de',
  'fit.tooShort': 'Encore',
  'fit.tooLongSuffix': 'retirez une perle',
  'fit.tooShortSuffix': 'pour une taille parfaite',

  // Fulfillment
  'fulfillment.label': 'Assemblage',
  'fulfillment.diy.label': 'Kit DIY · recommandé',
  'fulfillment.diy.detail': 'Les pièces préparées, à monter chez vous.',
  'fulfillment.assembled.label': 'Assemblé à Paris',
  'fulfillment.assembled.detail': 'Assemblé à la main par notre atelier parisien.',

  // Share preview / share modal
  'share.previewTitle': 'Prévisualisation',
  'share.modal.eyebrow': 'Partager mon bracelet',
  'share.modal.title': 'Donnez un nom à votre création',
  'share.modal.subtitle': 'Ce nom apparaîtra dans le lien partagé.',
  'share.modal.cancel': 'Annuler',
  'share.modal.confirm': 'Partager',
  'share.empty': 'GENEREZ UNE CREATION',
  'share.defaultName': 'Ma création',

  // Gift modal — creation
  'giftModal.eyebrow': 'Offrir un bracelet',
  'giftModal.title': 'Carte cadeau',
  'giftModal.designedHelp':
    'Le bracelet que vous venez de composer est offert avec un code unique. La personne qui le reçoit pourra le voir, l’ajuster ou valider tel quel.',
  'giftModal.openHelp':
    'La personne qui reçoit le code choisit ses perles et compose son bracelet en ligne dans l’atelier que vous lui réservez.',
  'giftModal.modeDesigned': 'Ma création',
  'giftModal.modeDesigned.detail': 'Le bracelet que je viens de composer',
  'giftModal.modeOpen': 'À composer',
  'giftModal.modeOpen.detail': 'La personne crée son propre bracelet',
  'giftModal.atelierLocked': 'Atelier réservé',
  'giftModal.bracelet': 'Bracelet offert',
  'giftModal.from': 'De la part de',
  'giftModal.to': 'Pour',
  'giftModal.fromPlaceholder': 'Votre prénom',
  'giftModal.toPlaceholder': 'Prénom du destinataire',
  'giftModal.message': 'Petit mot (facultatif)',
  'giftModal.messagePlaceholder': 'Bonne fête, joyeux anniversaire…',
  'giftModal.total': 'Total',
  'giftModal.generate': 'Générer le code',

  // Gift confirmation
  'giftConfirm.eyebrow': 'Carte créée',
  'giftConfirm.title': 'Votre code cadeau',
  'giftConfirm.helpDesigned':
    'Transmettez ce code à la personne qui recevra votre bracelet. Elle pourra l’ouvrir, le voir et l’ajuster avant la confection.',
  'giftConfirm.helpOpen':
    'Transmettez ce code à la personne. Elle compose son bracelet en ligne dans l’atelier',
  'giftConfirm.codeLabel': 'Code cadeau',
  'giftConfirm.recipient': 'Pour',
  'giftConfirm.fromShort': 'de la part de',
  'giftConfirm.copyCode': 'Copier le code',
  'giftConfirm.copied': 'Copié',
  'giftConfirm.sendLink': 'Envoyer le lien',
  'giftConfirm.done': 'Terminé',

  // Gift redemption modal
  'giftRedeem.eyebrow': 'Ouvrir une carte cadeau',
  'giftRedeem.title': 'Saisissez votre code',
  'giftRedeem.subtitle':
    'Le code se trouve sur votre carte cadeau ou dans le message qui vous a été envoyé.',
  'giftRedeem.placeholder': 'MNB-XXXX-XXXX',
  'giftRedeem.invalidFormat': 'Format invalide. Le code ressemble à MNB-XXXX-XXXX.',
  'giftRedeem.notFound': 'Ce code est inconnu ou a été créé sur un autre appareil.',
  'giftRedeem.cancel': 'Annuler',
  'giftRedeem.open': 'Ouvrir',

  // Unboxing modal
  'unboxing.eyebrow': 'Unboxing digital',
  'unboxing.length': 'Longueur',
  'unboxing.price': 'Prix',
  'unboxing.close': 'Fermer',
  'unboxing.share': 'Partager',

  // Commande / Checkout
  'checkout.eyebrow': 'Dernière étape',
  'checkout.title.line1': 'Finaliser',
  'checkout.title.line2': 'la commande',
  'checkout.section.contact': 'Contact',
  'checkout.section.delivery': 'Livraison',
  'checkout.section.payment': 'Paiement',
  'checkout.field.email': 'Email',
  'checkout.field.firstName': 'Prénom',
  'checkout.field.lastName': 'Nom',
  'checkout.field.address': 'Adresse',
  'checkout.field.addressExtra': 'Complément (facultatif)',
  'checkout.field.postalCode': 'Code postal',
  'checkout.field.city': 'Ville',
  'checkout.field.country': 'Pays',
  'checkout.field.phone': 'Téléphone',
  'checkout.newsletter': 'Je souhaite recevoir la newsletter MyNiceBracelet',
  'checkout.error.email': 'Adresse email invalide',
  'checkout.error.required': 'Requis',
  'checkout.error.postalCode': 'Code postal à 5 chiffres',
  'checkout.error.phone': 'Numéro invalide',
  'checkout.deliveryEstimate': 'Livraison estimée',
  'checkout.deliveryBetween': 'Entre le',
  'checkout.deliveryAnd': 'et le',
  'checkout.deliveryDiy': 'Les kits DIY partent sous 48h ouvrées.',
  'checkout.deliveryAssembled': 'Bracelets assemblés à la main dans notre atelier parisien.',
  'checkout.payment.title': 'Paiement sécurisé — Visa, Mastercard, Apple Pay',
  'checkout.payment.subtitle':
    'La passerelle Stripe / Mollie sera branchée à la mise en ligne. Cette étape est un placeholder pour la démo.',
  'checkout.pay': 'Payer',
  'checkout.cgvPrefix': 'En validant, vous acceptez nos',
  'checkout.cgv': 'CGV',
  'checkout.summary': 'Récapitulatif',
  'checkout.itemsSingular': 'article',
  'checkout.itemsPlural': 'articles',
  'checkout.freeShippingHint': 'Plus que',
  'checkout.freeShippingHintSuffix': 'pour la livraison offerte',
  'checkout.freeShippingDone': 'Livraison offerte débloquée !',
  'checkout.subtotal': 'Sous-total',
  'checkout.shipping': 'Livraison',
  'checkout.shippingFree': 'Offerte',
  'checkout.total': 'Total',
  'checkout.qty': 'Qté',
  'checkout.kit': 'Kit',
  'checkout.trust.payment': 'Paiement sécurisé',
  'checkout.trust.delivery': 'Livraison soignée',
  'checkout.trust.packaging': 'Emballage offert',

  // Empty cart
  'emptyCart.title': 'Votre panier est vide',
  'emptyCart.subtitle': 'Composez votre bracelet ou parcourez nos kits avant de passer commande.',
  'emptyCart.createMine': 'Créer le mien',
  'emptyCart.viewKits': 'Voir les kits',

  // Confirmation
  'confirm.eyebrow': 'Commande confirmée',
  'confirm.title.line1': 'Merci pour',
  'confirm.title.line2': 'votre confiance',
  'confirm.subtitle':
    'Un email de confirmation vient d’être envoyé. Votre commande est entre les mains de notre atelier parisien.',
  'confirm.orderNumber': 'Numéro de commande',
  'confirm.deliveryEstimate': 'Livraison estimée',
  'confirm.composeAnother': 'Composer un autre',
  'confirm.backHome': 'Retour à l’accueil',

  // Inspire button
  'inspire.label': 'Inspire-moi',
  'inspire.again': 'Encore',
  'inspire.styles': 'Styles',

  // Bracelet preview misc
  'preview.noBeads': 'AUCUNE PERLE',

  // Bead picker
  'bead.title': 'Choisissez vos perles',
  'bead.helper.empty': 'Encore {0} pour une taille parfaite',
  'bead.helper.ready': 'Votre bracelet est complet et parfaitement équilibré. Finalisons votre création.',
  'bead.helper.tooLong': 'Retirez une perle pour retrouver une composition équilibrée.',
  'bead.helper.tooShort': 'Encore {0} pour une taille parfaite',
  'bead.shape.label': 'Forme',
  'bead.shape.all': 'Toutes',
  'bead.empty.title': 'Section vide',
  'bead.empty.description': 'Aucune perle disponible pour le moment.',
  'bead.add': 'Ajouter',

  // Bead shapes (filter chips + tile labels)
  'shape.round': 'Ronde',
  'shape.faceted': 'Facettée',
  'shape.rondelle': 'Rondelle',
  'shape.nugget': 'Brute',
  'shape.tube': 'Tube',
  'shape.cube': 'Cube',
  'shape.heart': 'Cœur',
  'shape.star': 'Étoile',
  'shape.flower': 'Fleur',
  'shape.bow': 'Nœud',

  // Charm picker
  'charm.title.kawaii': 'Ajoutez une figurine',
  'charm.title.classic': 'Ajoutez des charms',
  'charm.subtitle.kawaii': 'Optionnel. Une figurine vient se fixer à côté du bracelet.',
  'charm.subtitle.classicSingular': 'Optionnel. Jusqu’à {0} charm.',
  'charm.subtitle.classicPlural': 'Optionnel. Jusqu’à {0} charms.',
  'charm.notAvailable': 'Cet atelier ne comprend pas de charms.',
  'charm.category.label': 'Catégorie',
  'charm.category.all': 'Tous',
  'charm.empty.title': 'Section vide',
  'charm.empty.figurines': 'Aucune figurine disponible pour le moment.',
  'charm.empty.charms': 'Aucun charm disponible pour le moment.',
  'charm.choose': 'Choisir',
  'charm.removeAria': 'Retirer',

  // Charm categories
  'charmCategory.lettre': 'Lettres',
  'charmCategory.coeur': 'Cœurs',
  'charmCategory.etoile': 'Étoiles',
  'charmCategory.animal': 'Animaux',
  'charmCategory.kawaii': 'Kawaii',
  'charmCategory.symbole': 'Symboles',
  'charmCategory.fleur': 'Fleurs',
  'charmCategory.lune': 'Lunes',
  'charmCategory.noeud': 'Nœuds',

  // Cart drawer
  'cart.title': 'Votre panier',
  'cart.checkout': 'Passer commande',
  'cart.continueShopping': 'Continuer mes achats',
  'cart.empty.title': 'Votre panier est vide',
  'cart.empty.subtitle': 'Découvrez nos kits ou composez un bracelet unique.',
  'cart.empty.viewKits': 'Voir les kits',
  'cart.empty.create': 'Créer un bracelet',

  // Cart line item
  'cartLine.kit': 'Kit',
  'cartLine.creation': 'Création',
  'cartLine.titleFallback': 'Bracelet personnalisé',
  'cartLine.elements': 'éléments',
  'cartLine.size': 'taille',

  // Footer
  'footer.tagline':
    'Bijoux personnalisés, assemblés à Paris par nos soins. Composez votre bracelet en boutique ou en ligne.',
  'footer.navigation': 'Navigation',
  'footer.contact': 'Contact',
  'footer.openAllWeek': 'Ouvert 7j/7',
  'footer.copyright': 'My Nice Bracelet Paris',
  'footer.legal': 'Mentions légales',
  'footer.privacy': 'Confidentialité',
  'footer.cgv': 'CGV',
  'footer.kits': 'Kits',
  'footer.create': 'Créer mon bracelet',

  // Misc
  'misc.optional': 'facultatif',
};

const EN: Dict = {
  // Header
  'header.home': 'Home',
  'header.ateliers': 'Workshops',
  'header.events': 'Events',
  'header.faq': 'FAQ',
  'header.parisBoutique': 'Paris Boutique',
  'header.cart': 'Cart',
  'header.menu': 'Menu',
  'header.closeMenu': 'Close menu',
  'header.backToShop': 'Back to shop',

  // Atelier selection
  'atelierSelect.eyebrow': 'Step 1 of 3',
  'atelierSelect.title.line1': 'Which workshop',
  'atelierSelect.title.line2': 'do you choose?',
  'atelierSelect.choose': 'Choose →',
  'atelierSelect.haveGiftCode': 'I have a gift code',

  'atelier.bracelet_bar.short': 'Essential',
  'atelier.kawaii.short': 'Kawaii',
  'atelier.classique.short': 'Classic',

  // Configurator — top bar
  'configurator.changeAtelier': 'Change workshop',
  'configurator.universe': 'Universe',

  // Configurator — gift redemption banner
  'gift.banner.toValidate': 'Gift to validate',
  'gift.banner.toCompose': 'Gift to compose',
  'gift.banner.from': 'from',
  'gift.banner.tweakDesigned': 'You can tweak this bracelet or confirm it as-is.',
  'gift.banner.composeOpen': 'Compose your bracelet — it’s on us.',
  'gift.banner.exit': 'Exit gift mode',

  // Configurator — size
  'size.perso': 'Custom',
  'size.confirm': 'Confirm',
  'size.decrease': 'Decrease size by 0.5 cm',
  'size.increase': 'Increase size by 0.5 cm',

  // Configurator — bracelet stage
  'configurator.empty': 'Drag a bead to start',
  'configurator.zoomIn': 'Zoom in',
  'configurator.zoomOut': 'Zoom out',
  'configurator.zoomReset': 'Zoom 100%',
  'configurator.restart': 'Restart',
  'configurator.reorganize': 'Reorganize',
  'configurator.remove': 'Remove',

  // Tabs / palette
  'tabs.beads': 'Beads',
  'tabs.charms': 'Charms',
  'tabs.figurines': 'Figurines',

  // Action row
  'action.share': 'Share',
  'action.linkCopied': 'Link copied',
  'action.shareOpen': 'Share opened',
  'action.shareCancelled': 'Share cancelled',
  'action.gift': 'Gift',
  'action.addToCart': 'Add to cart',
  'action.added': 'Added',
  'action.confirmGift': 'Confirm this gift',
  'action.confirmed': 'Confirmed',
  'action.offered': 'Free',

  // Fit messages
  'fit.empty': 'Add your first beads to compose the bracelet',
  'fit.ready': 'Perfect fit',
  'fit.tooLong': 'Too long by',
  'fit.tooShort': 'Still',
  'fit.tooLongSuffix': 'remove a bead',
  'fit.tooShortSuffix': 'for a perfect fit',

  // Fulfillment
  'fulfillment.label': 'Assembly',
  'fulfillment.diy.label': 'DIY Kit · recommended',
  'fulfillment.diy.detail': 'Pieces packaged, to assemble at home.',
  'fulfillment.assembled.label': 'Assembled in Paris',
  'fulfillment.assembled.detail': 'Hand-assembled by our Parisian atelier.',

  // Share preview / share modal
  'share.previewTitle': 'Preview',
  'share.modal.eyebrow': 'Share my bracelet',
  'share.modal.title': 'Name your creation',
  'share.modal.subtitle': 'This name will appear in the shared link.',
  'share.modal.cancel': 'Cancel',
  'share.modal.confirm': 'Share',
  'share.empty': 'CREATE A DESIGN',
  'share.defaultName': 'My creation',

  // Gift modal — creation
  'giftModal.eyebrow': 'Gift a bracelet',
  'giftModal.title': 'Gift card',
  'giftModal.designedHelp':
    'The bracelet you just composed is gifted with a unique code. The recipient will be able to view, tweak or accept it as-is.',
  'giftModal.openHelp':
    'The recipient picks their own beads and composes their bracelet online in the workshop you reserve for them.',
  'giftModal.modeDesigned': 'My creation',
  'giftModal.modeDesigned.detail': 'The bracelet I just composed',
  'giftModal.modeOpen': 'To compose',
  'giftModal.modeOpen.detail': 'The recipient creates their own',
  'giftModal.atelierLocked': 'Reserved workshop',
  'giftModal.bracelet': 'Gifted bracelet',
  'giftModal.from': 'From',
  'giftModal.to': 'To',
  'giftModal.fromPlaceholder': 'Your first name',
  'giftModal.toPlaceholder': 'Recipient’s first name',
  'giftModal.message': 'Note (optional)',
  'giftModal.messagePlaceholder': 'Happy birthday, with love…',
  'giftModal.total': 'Total',
  'giftModal.generate': 'Generate the code',

  // Gift confirmation
  'giftConfirm.eyebrow': 'Card created',
  'giftConfirm.title': 'Your gift code',
  'giftConfirm.helpDesigned':
    'Send this code to the person who will receive your bracelet. They’ll be able to open it, view it and tweak it before crafting.',
  'giftConfirm.helpOpen':
    'Send this code to the person. They will compose their bracelet online in the workshop',
  'giftConfirm.codeLabel': 'Gift code',
  'giftConfirm.recipient': 'For',
  'giftConfirm.fromShort': 'from',
  'giftConfirm.copyCode': 'Copy code',
  'giftConfirm.copied': 'Copied',
  'giftConfirm.sendLink': 'Send link',
  'giftConfirm.done': 'Done',

  // Gift redemption modal
  'giftRedeem.eyebrow': 'Open a gift card',
  'giftRedeem.title': 'Enter your code',
  'giftRedeem.subtitle':
    'The code is on your gift card or in the message you received.',
  'giftRedeem.placeholder': 'MNB-XXXX-XXXX',
  'giftRedeem.invalidFormat': 'Invalid format. The code looks like MNB-XXXX-XXXX.',
  'giftRedeem.notFound': 'This code is unknown or was created on another device.',
  'giftRedeem.cancel': 'Cancel',
  'giftRedeem.open': 'Open',

  // Unboxing modal
  'unboxing.eyebrow': 'Digital unboxing',
  'unboxing.length': 'Length',
  'unboxing.price': 'Price',
  'unboxing.close': 'Close',
  'unboxing.share': 'Share',

  // Checkout
  'checkout.eyebrow': 'Final step',
  'checkout.title.line1': 'Complete',
  'checkout.title.line2': 'your order',
  'checkout.section.contact': 'Contact',
  'checkout.section.delivery': 'Delivery',
  'checkout.section.payment': 'Payment',
  'checkout.field.email': 'Email',
  'checkout.field.firstName': 'First name',
  'checkout.field.lastName': 'Last name',
  'checkout.field.address': 'Address',
  'checkout.field.addressExtra': 'Address line 2 (optional)',
  'checkout.field.postalCode': 'Postal code',
  'checkout.field.city': 'City',
  'checkout.field.country': 'Country',
  'checkout.field.phone': 'Phone',
  'checkout.newsletter': 'Subscribe to the MyNiceBracelet newsletter',
  'checkout.error.email': 'Invalid email address',
  'checkout.error.required': 'Required',
  'checkout.error.postalCode': '5-digit postal code',
  'checkout.error.phone': 'Invalid number',
  'checkout.deliveryEstimate': 'Estimated delivery',
  'checkout.deliveryBetween': 'Between',
  'checkout.deliveryAnd': 'and',
  'checkout.deliveryDiy': 'DIY kits ship within 48 business hours.',
  'checkout.deliveryAssembled': 'Bracelets hand-assembled in our Parisian atelier.',
  'checkout.payment.title': 'Secure payment — Visa, Mastercard, Apple Pay',
  'checkout.payment.subtitle':
    'The Stripe / Mollie gateway will be wired in for launch. This step is a demo placeholder.',
  'checkout.pay': 'Pay',
  'checkout.cgvPrefix': 'By validating, you accept our',
  'checkout.cgv': 'Terms',
  'checkout.summary': 'Summary',
  'checkout.itemsSingular': 'item',
  'checkout.itemsPlural': 'items',
  'checkout.freeShippingHint': 'Just',
  'checkout.freeShippingHintSuffix': 'more for free shipping',
  'checkout.freeShippingDone': 'Free shipping unlocked!',
  'checkout.subtotal': 'Subtotal',
  'checkout.shipping': 'Shipping',
  'checkout.shippingFree': 'Free',
  'checkout.total': 'Total',
  'checkout.qty': 'Qty',
  'checkout.kit': 'Kit',
  'checkout.trust.payment': 'Secure payment',
  'checkout.trust.delivery': 'Careful delivery',
  'checkout.trust.packaging': 'Free packaging',

  // Empty cart
  'emptyCart.title': 'Your cart is empty',
  'emptyCart.subtitle': 'Compose your bracelet or browse our kits before checking out.',
  'emptyCart.createMine': 'Create my own',
  'emptyCart.viewKits': 'View kits',

  // Confirmation
  'confirm.eyebrow': 'Order confirmed',
  'confirm.title.line1': 'Thank you',
  'confirm.title.line2': 'for your trust',
  'confirm.subtitle':
    'A confirmation email has just been sent. Your order is in the hands of our Parisian atelier.',
  'confirm.orderNumber': 'Order number',
  'confirm.deliveryEstimate': 'Estimated delivery',
  'confirm.composeAnother': 'Compose another',
  'confirm.backHome': 'Back to home',

  // Inspire button
  'inspire.label': 'Inspire me',
  'inspire.again': 'Again',
  'inspire.styles': 'Styles',

  // Bracelet preview misc
  'preview.noBeads': 'NO BEADS',

  // Bead picker
  'bead.title': 'Choose your beads',
  'bead.helper.empty': '{0} more for a perfect fit',
  'bead.helper.ready': 'Your bracelet is complete and perfectly balanced. Let’s finalise it.',
  'bead.helper.tooLong': 'Remove a bead to restore a balanced composition.',
  'bead.helper.tooShort': '{0} more for a perfect fit',
  'bead.shape.label': 'Shape',
  'bead.shape.all': 'All',
  'bead.empty.title': 'Empty section',
  'bead.empty.description': 'No beads available right now.',
  'bead.add': 'Add',

  // Bead shapes
  'shape.round': 'Round',
  'shape.faceted': 'Faceted',
  'shape.rondelle': 'Rondelle',
  'shape.nugget': 'Nugget',
  'shape.tube': 'Tube',
  'shape.cube': 'Cube',
  'shape.heart': 'Heart',
  'shape.star': 'Star',
  'shape.flower': 'Flower',
  'shape.bow': 'Bow',

  // Charm picker
  'charm.title.kawaii': 'Add a figurine',
  'charm.title.classic': 'Add charms',
  'charm.subtitle.kawaii': 'Optional. A figurine attaches next to the bracelet.',
  'charm.subtitle.classicSingular': 'Optional. Up to {0} charm.',
  'charm.subtitle.classicPlural': 'Optional. Up to {0} charms.',
  'charm.notAvailable': 'This workshop does not include charms.',
  'charm.category.label': 'Category',
  'charm.category.all': 'All',
  'charm.empty.title': 'Empty section',
  'charm.empty.figurines': 'No figurines available right now.',
  'charm.empty.charms': 'No charms available right now.',
  'charm.choose': 'Choose',
  'charm.removeAria': 'Remove',

  // Charm categories
  'charmCategory.lettre': 'Letters',
  'charmCategory.coeur': 'Hearts',
  'charmCategory.etoile': 'Stars',
  'charmCategory.animal': 'Animals',
  'charmCategory.kawaii': 'Kawaii',
  'charmCategory.symbole': 'Symbols',
  'charmCategory.fleur': 'Flowers',
  'charmCategory.lune': 'Moons',
  'charmCategory.noeud': 'Bows',

  // Cart drawer
  'cart.title': 'Your cart',
  'cart.checkout': 'Checkout',
  'cart.continueShopping': 'Continue shopping',
  'cart.empty.title': 'Your cart is empty',
  'cart.empty.subtitle': 'Discover our kits or compose a unique bracelet.',
  'cart.empty.viewKits': 'View kits',
  'cart.empty.create': 'Create a bracelet',

  // Cart line item
  'cartLine.kit': 'Kit',
  'cartLine.creation': 'Creation',
  'cartLine.titleFallback': 'Custom bracelet',
  'cartLine.elements': 'pieces',
  'cartLine.size': 'size',

  // Footer
  'footer.tagline':
    'Personalised jewellery, hand-assembled in Paris. Compose your bracelet in our boutique or online.',
  'footer.navigation': 'Navigation',
  'footer.contact': 'Contact',
  'footer.openAllWeek': 'Open 7 days a week',
  'footer.copyright': 'My Nice Bracelet Paris',
  'footer.legal': 'Legal notice',
  'footer.privacy': 'Privacy',
  'footer.cgv': 'Terms',
  'footer.kits': 'Kits',
  'footer.create': 'Create my bracelet',

  'misc.optional': 'optional',
};

export const MESSAGES: Record<Lang, Dict> = { FR, EN };

/** Lookup a translation key. Falls back to the FR string when EN is
 *  missing (so half-translated builds still display rather than blow
 *  up), and ultimately falls back to the key itself if neither is set. */
export function lookup(lang: Lang, key: string): string {
  return MESSAGES[lang][key] ?? MESSAGES.FR[key] ?? key;
}
