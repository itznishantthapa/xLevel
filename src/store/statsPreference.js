import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default configuration
const DEFAULT_STATS = [
  { id: 'watchads', type: 'watchads', name: 'Watch Ads', icon: 'play-circle-outline', iconLib: 'Ionicons' },
  { id: 'leaderboard', type: 'leaderboard', name: 'Leaderboard', icon: 'trophy', iconLib: 'SimpleLineIcons' },
  { id: 'tournament', type: 'tournament', name: 'Tournaments', icon: 'game-controller-outline', iconLib: 'Ionicons' },
  { id: 'matches', type: 'matches', name: 'My Match', icon: 'gamepad-circle-right', iconLib: 'MaterialCommunityIcons' },
];

// Configuration when point banner exists
const POINT_BANNER_STATS = [
  { id: 'gamerules', type: 'leaderboard', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons' },
  { id: 'tournament', type: 'tournament', name: 'Tournaments', icon: 'game-controller-outline', iconLib: 'Ionicons' },
  { id: 'matches', type: 'matches', name: 'My Match', icon: 'gamepad-circle-right', iconLib: 'MaterialCommunityIcons' },
  { id: 'redeem', type: 'watchads', name: 'Redeem', icon: 'wallet-giftcard', iconLib: 'MaterialCommunityIcons' },
];

// Toggleable options
const TOGGLEABLE_OPTIONS = {
  watchads: {
    primary: { id: 'watchads', type: 'watchads', name: 'Watch Ads', icon: 'play-circle-outline', iconLib: 'Ionicons' },
    secondary: { id: 'redeem', type: 'watchads', name: 'Redeem', icon: 'wallet-giftcard', iconLib: 'MaterialCommunityIcons' },
  },
  leaderboard: {
    primary: { id: 'leaderboard', type: 'leaderboard', name: 'Leaderboard', icon: 'trophy', iconLib: 'SimpleLineIcons' },
    secondary: { id: 'gamerules', type: 'leaderboard', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons' },
    tertiary: { id: 'transaction', type: 'leaderboard', name: 'Transaction', icon: 'receipt-long', iconLib: 'MaterialIcons' },
  },
};

export const useStatsPreferenceStore = create(
  persist(
    (set, get) => ({
      // State
      statsConfig: DEFAULT_STATS,
      isLoading: false,
      hasPointBanner: false,

      // Actions
      updateStatsConfig: (newConfig) => {
        set({ statsConfig: newConfig });
      },

      setStatsBasedOnPointBanner: (hasPointBanner) => {
        const currentHasPointBanner = get().hasPointBanner;
        
        // Only update if the point banner state has changed
        if (currentHasPointBanner !== hasPointBanner) {
          set({ 
            hasPointBanner,
            statsConfig: hasPointBanner ? POINT_BANNER_STATS : DEFAULT_STATS 
          });
        }
      },

      toggleStatsItem: (index) => {
        const currentConfig = get().statsConfig;
        const currentItem = currentConfig[index];
        const toggleOptions = TOGGLEABLE_OPTIONS[currentItem.type];

        if (toggleOptions) {
          const newConfig = [...currentConfig];
          let newItem;
          
          // Handle 3-way toggle for leaderboard type
          if (toggleOptions.tertiary) {
            if (currentItem.id === toggleOptions.primary.id) {
              newItem = toggleOptions.secondary;
            } else if (currentItem.id === toggleOptions.secondary.id) {
              newItem = toggleOptions.tertiary;
            } else {
              newItem = toggleOptions.primary;
            }
          } else {
            // Handle 2-way toggle for other types
            const isCurrentPrimary = currentItem.id === toggleOptions.primary.id;
            newItem = isCurrentPrimary ? toggleOptions.secondary : toggleOptions.primary;
          }
          
          // Preserve the type for future toggles
          newConfig[index] = { ...newItem, type: currentItem.type };
          
          set({ statsConfig: newConfig });
        }
      },

      reorderStatsItems: (fromIndex, toIndex) => {
        const currentConfig = get().statsConfig;
        const newConfig = [...currentConfig];
        const [movedItem] = newConfig.splice(fromIndex, 1);
        newConfig.splice(toIndex, 0, movedItem);
        
        set({ statsConfig: newConfig });
      },

      resetToDefault: () => {
        set({ statsConfig: DEFAULT_STATS, hasPointBanner: false });
      },

      // Getters/Constants
      getToggleableOptions: () => TOGGLEABLE_OPTIONS,
      getDefaultStats: () => DEFAULT_STATS,
      getPointBannerStats: () => POINT_BANNER_STATS,
    }),
    {
      name: 'stats-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);