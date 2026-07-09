export const FCM_USER_TOPIC = 'level_users';

export const POINTS_REFRESH_NOTIFICATION_TITLES = [
  'Withdrawal Rejected',
  'Point Credited Successfully',
  'Withdrawal Approved',
  'Point Load Failed',
];

export const shouldRefreshPointsDataOnNotification = (title = '') =>
  POINTS_REFRESH_NOTIFICATION_TITLES.includes(String(title).trim());

export const GAME_CREATION_TOPICS = {
  freefire: 'freefirecreation',
  pubg: 'pubgcreation',
  efootball: 'efootballcreation',
  mlbb: 'mlbbcreation',
};

export const getGameCreationTopicKey = (gameName = '') => {
  const name = gameName.toLowerCase();
  if (name.includes('free fire') || name.includes('freefire')) return 'freefire';
  if (name.includes('pubg')) return 'pubg';
  if (name.includes('efootball')) return 'efootball';
  if (name.includes('mlbb')) return 'mlbb';
  return null;
};

export const getGameCreationTopic = (gameName = '') => {
  const key = getGameCreationTopicKey(gameName);
  return key ? GAME_CREATION_TOPICS[key] : null;
};

export const getGameCreationStorageKey = (gameKey) => `topic_${gameKey}_creation`;

const GAME_CREATION_ALERT_COPY = {
  freefire: {
    alertTitle: 'FreeFire Alert',
    matchName: 'freefire',
  },
  pubg: {
    alertTitle: 'PUBG Alert',
    matchName: 'pubg',
  },
  efootball: {
    alertTitle: 'Efootball Alert',
    matchName: 'efootball',
  },
  mlbb: {
    alertTitle: 'MLBB Alert',
    matchName: 'mlbb',
  },
};

export const getGameCreationAlertCopy = (gameName = '', isSubscribed = false) => {
  const gameKey = getGameCreationTopicKey(gameName);
  const copy = gameKey
    ? GAME_CREATION_ALERT_COPY[gameKey]
    : {
        alertTitle: `${gameName.replace(/\s+/g, '')} Alert`,
        matchName: gameName.toLowerCase().replace(/\s+/g, ''),
      };

  return {
    alertTitle: copy.alertTitle,
    message: isSubscribed
      ? `You will no longer receive notifications when someone creates a ${copy.matchName} match.`
      : `You will received notification when someone creates the ${copy.matchName} match.`,
    confirmText: isSubscribed ? 'Turn Off' : 'Turn On',
    cancelText: 'Cancel',
    isDestructive: isSubscribed,
  };
};

