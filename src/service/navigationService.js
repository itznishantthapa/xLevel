// NavigationService.js
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  pendingNavigation: null,

  navigate: (name, params) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    } else {
      NavigationService.pendingNavigation = { name, params };
    }
  },

  executePendingNavigation: () => {
    if (NavigationService.pendingNavigation && navigationRef.isReady()) {
      const { name, params } = NavigationService.pendingNavigation;
      navigationRef.navigate(name, params);
      NavigationService.pendingNavigation = null;
    }
  },
};
