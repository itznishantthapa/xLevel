import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default configuration
const DEFAULT_STATS = [
  { id: 'gamerules', type: 'gamerules', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons' },
  { id: 'leaderboard', type: 'leaderboard', name: 'Leaderboard', icon: 'trophy', iconLib: 'SimpleLineIcons' },
  { id: 'tournament', type: 'tournament', name: 'Tournaments', icon: 'game-controller-outline', iconLib: 'Ionicons' },
  { id: 'matches', type: 'matches', name: 'My Match', icon: 'gamepad-circle-right', iconLib: 'MaterialCommunityIcons' },
];

// Configuration when QR exists - shows Transaction, Tournament, MyMatch, Redeem
const QR_AVAILABLE_STATS = [
  { id: 'transaction', type: 'leaderboard', name: 'Transaction', icon: 'receipt-long', iconLib: 'MaterialIcons' },
  { id: 'tournament', type: 'tournament', name: 'Tournaments', icon: 'game-controller-outline', iconLib: 'Ionicons' },
  { id: 'matches', type: 'matches', name: 'My Match', icon: 'gamepad-circle-right', iconLib: 'MaterialCommunityIcons' },
  { id: 'redeem', type: 'gamerules', name: 'Redeem', icon: 'wallet-giftcard', iconLib: 'MaterialCommunityIcons' },
];

// Toggleable options
const TOGGLEABLE_OPTIONS = {
  // gamerules toggles between Game Rules and Redeem
  gamerules: {
    primary: { id: 'gamerules', type: 'gamerules', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons' },
    secondary: { id: 'redeem', type: 'gamerules', name: 'Redeem', icon: 'wallet-giftcard', iconLib: 'MaterialCommunityIcons' },
  },
  // leaderboard toggles between Leaderboard and Transaction
  leaderboard: {
    primary: { id: 'leaderboard', type: 'leaderboard', name: 'Leaderboard', icon: 'trophy', iconLib: 'SimpleLineIcons' },
    secondary: { id: 'transaction', type: 'leaderboard', name: 'Transaction', icon: 'receipt-long', iconLib: 'MaterialIcons' },
  },
};

export const useStatsPreferenceStore = create(
  persist(
    (set, get) => ({
      // State
      statsConfig: DEFAULT_STATS,
      isLoading: false,
      hasQR: false,

      // Actions
      updateStatsConfig: (newConfig) => {
        set({ statsConfig: newConfig });
      },

      setStatsBasedOnQR: (hasQR) => {
        const currentHasQR = get().hasQR;
        // Only update if the QR state has changed
        if (currentHasQR !== hasQR) {
          const newConfig = hasQR ? QR_AVAILABLE_STATS : DEFAULT_STATS;
          set({ 
            hasQR,
            statsConfig: newConfig 
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
        set({ statsConfig: DEFAULT_STATS, hasQR: false });
      },

      // Getters/Constants
      getToggleableOptions: () => TOGGLEABLE_OPTIONS,
      getDefaultStats: () => DEFAULT_STATS,
      getQRAvailableStats: () => QR_AVAILABLE_STATS,
    }),
    {
      name: 'stats-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: async (persistedState, version) => {
        try {
          if (!persistedState || typeof persistedState !== 'object') return persistedState;
          const next = { ...persistedState };
          
          if (version < 3) {
            // Reset to default stats for version 3 to ensure clean QR-based configuration
            next.statsConfig = DEFAULT_STATS;
            next.hasQR = false;
          }
          
          if (Array.isArray(next.statsConfig)) {
            next.statsConfig = next.statsConfig.map((item) => {
              if (!item || typeof item !== 'object') return item;
              // Map any legacy 'watchads' type to the new 'gamerules' type
              if (item.type === 'watchads') {
                if (item.id === 'redeem') {
                  // Keep Redeem visually the same but set type to gamerules
                  const opt = TOGGLEABLE_OPTIONS.gamerules?.secondary;
                  return opt ? { ...opt, type: 'gamerules' } : { ...item, type: 'gamerules' };
                }
                // Default to Game Rules when migrating from watchads
                const opt = TOGGLEABLE_OPTIONS.gamerules?.primary;
                return opt ? { ...opt, type: 'gamerules' } : { ...item, id: 'gamerules', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons', type: 'gamerules' };
              }
              return item;
            });
          }
          return next;
        } catch (e) {
          return persistedState;
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);