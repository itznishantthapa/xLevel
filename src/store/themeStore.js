// store/themeStore.js
// Lightweight theme store that follows the device color scheme by default
// Exposes `isLight` and `toggleTheme`. When the user toggles, we stop
// following the system until `setUseSystem(true)` is called again.

import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme storage keys
const THEME_STORAGE_KEY = '@wingo_theme_preference';
const THEME_USE_SYSTEM_KEY = '@wingo_theme_use_system';

// Load saved theme or determine from device
const loadSavedThemePreference = async () => {
  try {
    const [savedTheme, savedUseSystem] = await Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      AsyncStorage.getItem(THEME_USE_SYSTEM_KEY),
    ]);
    
    const useSystem = savedUseSystem === null ? true : savedUseSystem === 'true';
    
    if (useSystem) {
      // If following system, use device theme
      return { isLight: Appearance.getColorScheme() !== 'dark', useSystem: true };
    } else if (savedTheme !== null) {
      // If theme preference exists, use it
      return { isLight: savedTheme === 'light', useSystem: false };
    } else {
      // Default to device theme if no saved preference
      return { isLight: Appearance.getColorScheme() !== 'dark', useSystem: true };
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Error loading theme preference:', error);
    }
    return { isLight: Appearance.getColorScheme() !== 'dark', useSystem: true };
  }
};

// Determine initial scheme from device until we load from storage
const initialIsLight = Appearance.getColorScheme() !== 'dark';

export const useThemeStore = create((set, get) => ({
  // Whether the UI should render in light colors
  isLight: initialIsLight,

  // Whether to follow the device color scheme automatically
  useSystem: true,

  // Manually toggle the theme and stop following the system
  toggleTheme: () => {
    const { isLight } = get();
    const newIsLight = !isLight;
    
    // Save preference to AsyncStorage
    AsyncStorage.setItem(THEME_STORAGE_KEY, newIsLight ? 'light' : 'dark');
    AsyncStorage.setItem(THEME_USE_SYSTEM_KEY, 'false');
    
    set({ isLight: newIsLight, useSystem: false });
  },

  // Re-enable following the system setting; immediately sync to device
  setUseSystem: (shouldUse) => {
    if (shouldUse) {
      const deviceIsLight = Appearance.getColorScheme() !== 'dark';
      
      // Save preference to AsyncStorage
      AsyncStorage.setItem(THEME_USE_SYSTEM_KEY, 'true');
      
      set({ useSystem: true, isLight: deviceIsLight });
    } else {
      // Save preference to AsyncStorage
      AsyncStorage.setItem(THEME_USE_SYSTEM_KEY, 'false');
      
      set({ useSystem: false });
    }
  },
  
  // Initialize theme from stored preferences
  initializeTheme: async () => {
    const themePreference = await loadSavedThemePreference();
    set(themePreference);
  },
}));

// Keep store in sync with device scheme when useSystem is true
Appearance.addChangeListener(({ colorScheme }) => {
  const { useSystem } = useThemeStore.getState();
  if (useSystem) {
    useThemeStore.setState({ isLight: colorScheme !== 'dark' });
  }
});


