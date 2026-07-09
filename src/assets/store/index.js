export const STORE_THEMES = {
  freefire: {
    label: 'FREE FIRE',
    listSubtitle: 'Top up diamonds',
    subtitle: 'Top up diamonds | Delivery within 5 minutes',
    gradient: ['#C2410C', '#F59E0B'],
    gradientStart: { x: 0, y: 1 },
    gradientEnd: { x: 1, y: 0 },
  },
  pubg: {
    label: 'PUBG MOBILE',
    listSubtitle: 'Top up UC',
    subtitle: 'UC & items | Delivery within 5 minutes',
    gradient: ['#0F766E', '#1E3A5F'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
  efootball: {
    label: 'EFOOTBALL',
    listSubtitle: 'Top up coins',
    subtitle: 'Coins & packs | Delivery within 5 minutes',
    gradient: ['#7C3AED', '#312E81'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
  mlbb: {
    label: 'MLBB',
    listSubtitle: 'Top up diamonds',
    subtitle: 'Diamonds & skins | Delivery within 5 minutes',
    gradient: ['#4338CA', '#7C3AED', '#EA580C'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
  },
};

export const storeHeroImages = {
  freefire: require('../freefirestore.png'),
  pubg: require('../pubgstore.png'),
  efootball: require('../efootballstore.png'),
  mlbb: require('../mlbbstore.png'),
};
