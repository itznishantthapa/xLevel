import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useStoreItems } from '../queries/useStoreItems';

const OPENING_MIN_MS = 2000;

/**
 * Fetches store items and shows the opening loader for at least 2 seconds
 * every time the store screen comes into focus.
 */
export const useStoreScreenData = (game) => {
  const [isOpening, setIsOpening] = useState(true);
  const { data: storeItemsData, refetch, ...queryRest } = useStoreItems(game);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadStore = async () => {
        setIsOpening(true);

        try {
          await Promise.all([
            refetch(),
            new Promise((resolve) => setTimeout(resolve, OPENING_MIN_MS)),
          ]);
        } finally {
          if (!cancelled) {
            setIsOpening(false);
          }
        }
      };

      loadStore();

      return () => {
        cancelled = true;
      };
    }, [refetch]),
  );

  return {
    storeItemsData,
    isOpening,
    refetch,
    ...queryRest,
  };
};
