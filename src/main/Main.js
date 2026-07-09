import { NavigationContainer } from '@react-navigation/native';
import { ErrorBoundary } from 'react-error-boundary';
import AppErrorFallback from '../component/customer/fallback/AppErrorFallback';
import { navigationRef, NavigationService } from '../service/navigationService';
import { Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Navigation
import SignupNavigator from '../navigation/SignupNavigator';
import CustomerNavigator from '../navigation/CustomerNavigator';
import AdminNavigator from '../navigation/AdminNavigator';

// Store
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// Hooks
import { useNotificationEngine } from '../hooks/useNotificationEngine';

// Utils
import { useBanners } from '../queries/useBanners';
import { useGames } from '../queries/useGames';
import NoConnection from '../screens/NoConnection';
import UpdateScreen from '../screens/UpdateScreen';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { checkIfUpdateRequired } from '../service/versionService';

//============ Prevent Auto Hide Splash Screen ============
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const {
    initAuth,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isInitialized,
  } = useAuthStore();

  const { initializeTheme } = useThemeStore();
  useBanners();
  useGames();

  const { isConnected } = useNetworkStatus();
  const [updateRequired, setUpdateRequired] = useState(false);

  useNotificationEngine();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      await checkVersion();
      await initializeTheme();
      await initAuth();
    };
    init();
  }, []);

  const checkVersion = async () => {
    try {
      const needsUpdate = await checkIfUpdateRequired();
      setUpdateRequired(needsUpdate);
    } catch (error) {
      if (__DEV__) {
        console.log('Version check error:', error);
      }
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isInitialized && getContent() !== null) {
      SplashScreen.hide();
    }
  }, [isInitialized, isAuthenticated, isAdmin, isCustomer]);

  function getContent() {
    if (!isInitialized) return null;

    if (isAuthenticated) {
      return isCustomer ? <CustomerNavigator /> : isAdmin ? <AdminNavigator /> : null;
    }

    return <SignupNavigator />;
  }

  return updateRequired ? (
    <UpdateScreen />
  ) : isConnected ? (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        NavigationService.executePendingNavigation();
      }}
    >
      <ErrorBoundary
        FallbackComponent={AppErrorFallback}
        onError={(error, info) => {
          if (__DEV__) console.error('Navigation Error:', error, info);
        }}
      >
        {getContent()}
      </ErrorBoundary>
    </NavigationContainer>
  ) : (
    <NoConnection
      onRetry={async () => {
        try {
          await initializeTheme();
          await initAuth();
        } catch {}
      }}
    />
  );
}
