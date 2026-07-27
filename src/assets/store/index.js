export const STORE_THEMES = {
  freefire: {
    label: 'FREE FIRE',
    listSubtitle: 'Top up diamonds and more items',
    subtitle: 'Top up diamonds | Delivery within 5 minutes',
    gradient: ['#FF416C', '#FF4B2B'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
  pubg: {
    label: 'PUBG MOBILE',
    listSubtitle: 'Top up UC and more items you want',
    subtitle: 'UC & items | Delivery within 5 minutes',
    gradient: ['#F7971E', '#FFD200'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
  efootball: {
    label: 'EFOOTBALL, FC & MORE',
    listSubtitle: 'Top up coins, subscriptions & more',
    subtitle: 'eFootball, FC Mobile & subscriptions',
    gradient: ['#00C6FF', '#0072FF'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
  mlbb: {
    label: 'MLBB',
    listSubtitle: 'Top up diamonds and more items you want',
    subtitle: 'Diamonds & skins | Delivery within 5 minutes',
    gradient: ['#A855F7', '#6D28D9'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
};

export const storeCardLogos = {
  freefire: require('../ffstorelogo.png'),
  pubg: require('../pubgstorelogo.png'),
  efootball: require('../efootballstore.png'),
  fcmobile: require('../fcmobilestore.png'),
  mlbb: require('../mlbbstorelogo.png'),
};

export const storeHeroImages = {
  freefire: storeCardLogos.freefire,
  pubg: storeCardLogos.pubg,
  efootball: storeCardLogos.efootball,
  mlbb: storeCardLogos.mlbb,
};

export const storeStackedHeroImages = {
  efootball: [storeCardLogos.fcmobile, storeCardLogos.efootball],
};
