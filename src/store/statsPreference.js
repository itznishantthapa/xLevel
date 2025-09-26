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

// Toggleable options
const TOGGLEABLE_OPTIONS = {
  watchads: {
    primary: { id: 'watchads', type: 'watchads', name: 'Watch Ads', icon: 'play-circle-outline', iconLib: 'Ionicons' },
    secondary: { id: 'gameprofile', type: 'watchads', name: 'Game Profiles', icon: 'playlist-add', iconLib: 'MaterialIcons' },
  },
  leaderboard: {
    primary: { id: 'leaderboard', type: 'leaderboard', name: 'Leaderboard', icon: 'trophy', iconLib: 'SimpleLineIcons' },
    secondary: { id: 'gamerules', type: 'leaderboard', name: 'Game Rules', icon: 'book-outline', iconLib: 'Ionicons' },
  },
};

export const useStatsPreferenceStore = create(
  persist(
    (set, get) => ({
      // State
      statsConfig: DEFAULT_STATS,
      isLoading: false,

      // Actions
      updateStatsConfig: (newConfig) => {
        set({ statsConfig: newConfig });
      },

      toggleStatsItem: (index) => {
        const currentConfig = get().statsConfig;
        const currentItem = currentConfig[index];
        const toggleOptions = TOGGLEABLE_OPTIONS[currentItem.type];

        if (toggleOptions) {
          const newConfig = [...currentConfig];
          const isCurrentPrimary = currentItem.id === toggleOptions.primary.id;
          const newItem = isCurrentPrimary ? toggleOptions.secondary : toggleOptions.primary;
          
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
        set({ statsConfig: DEFAULT_STATS });
      },

      // Getters/Constants
      getToggleableOptions: () => TOGGLEABLE_OPTIONS,
      getDefaultStats: () => DEFAULT_STATS,
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