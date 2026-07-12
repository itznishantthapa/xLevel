import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

const ANTICHEAT_COLLECTION = 'anticheat';
const ANTICHEAT_KEYWORDS_DOC_ID = 'cheatKeywords';
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1500, 3000];

let cachedKeywords = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeKeywords = (keywords) =>
  keywords
    .map((keyword) => String(keyword).trim().toLowerCase())
    .filter(Boolean);

const isTransientFirestoreError = (error) => {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();

  return (
    code === 'firestore/unavailable' ||
    code === 'firestore/deadline-exceeded' ||
    message.includes('unavailable') ||
    message.includes('network')
  );
};

const fetchKeywordsFromFirestore = async () => {
  const app = getApp();
  const db = getFirestore(app);
  const keywordsRef = doc(db, ANTICHEAT_COLLECTION, ANTICHEAT_KEYWORDS_DOC_ID);
  const keywordsDoc = await getDoc(keywordsRef);

  if (!keywordsDoc.exists()) {
    if (__DEV__) {
      console.warn('Cheat keywords document is missing.');
    }
    return [];
  }

  const data = keywordsDoc.data();
  const remoteKeywords = Array.isArray(data?.keywords) ? data.keywords : [];

  if (remoteKeywords.length === 0) {
    if (__DEV__) {
      console.warn('Cheat keywords document is empty.');
    }
    return [];
  }

  return normalizeKeywords(remoteKeywords);
};

/**
 * Fetches cheat keywords from Firebase Firestore.
 *
 * Firestore document:
 *   collection: anticheat
 *   document:   cheatKeywords
 *   field:      keywords (array of strings)
 */
export const getCheatKeywords = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedKeywords) {
    return cachedKeywords;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const keywords = await fetchKeywordsFromFirestore();

      if (keywords.length > 0) {
        cachedKeywords = keywords;
        return cachedKeywords;
      }

      return [];
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (!isLastAttempt && isTransientFirestoreError(error)) {
        if (__DEV__) {
          console.log(
            `Cheat keywords fetch unavailable, retrying (${attempt + 1}/${MAX_RETRIES})...`,
          );
        }
        await sleep(RETRY_DELAYS_MS[attempt] ?? 3000);
        continue;
      }

      if (__DEV__) {
        console.error('Error fetching cheat keywords from Firestore:', error);
      }
      return [];
    }
  }

  return [];
};

export const prefetchCheatKeywords = async () => getCheatKeywords({ forceRefresh: true });

export const clearCheatKeywordsCache = () => {
  cachedKeywords = null;
};
