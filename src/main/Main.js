import { NavigationContainer } from '@react-navigation/native';
import { ErrorBoundary } from 'react-error-boundary';
import AppErrorFallback from '../component/customer/fallback/AppErrorFallback';
import { navigationRef, NavigationService } from '../service/navigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
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
// Stores removed; notification handling will call service functions directly

// Services
import {
  requestNotificationPermission,
  getFCMToken,
  setupNotificationListeners,
  setupNotificationChannel,
  postFCMToken
} from '../service/notificationService';

// Utils
import { checkFCMTokenInStorage, storeFCMToken } from '../utils/tokenUtils';
import { useBanners } from '../queries/useBanners';
import { useSocials } from '../queries/useSocials';
import { useGames } from '../queries/useGames';
// import { useAppQueries } from '../hooks/useAppQueries';
import NoConnection from '../screens/NoConnection';
import UpdateScreen from '../screens/UpdateScreen';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { checkIfUpdateRequired } from '../service/versionService';

//============ Prevent Auto Hide Splash Screen ============
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {

  // const { user, get_user } = useAuthStore()
  //============ Store Hooks ============
  const {
    get_user,
    isAuthenticated,
    initAuth,
    isAdmin,
    isCustomer,
    isInitialized
  } = useAuthStore();

  // ================ Initialize App Prequisites ================
  const { initializeTheme } = useThemeStore();
  useBanners()
  useSocials()
  useGames()

  // Network
  const { isConnected } = useNetworkStatus();

  // Version check
  const [updateRequired, setUpdateRequired] = useState(false);


  //============ Notification Unsubscribe Ref ============
  const notificationUnsubscribeRef = useRef(null);



  // Initialize app queries
  // useAppQueries();


  //============ Animation Ref ============
  const fadeAnim = useRef(new Animated.Value(0)).current;

  //============ Initialize App ============
  useEffect(() => {
    const init = async () => {
      // Initialize theme from saved preferences
      await  checkVersion();
      await initializeTheme();

      // Initialize authentication
      await initAuth();

      // await initialize_uid();
      // await get_banners();
      // await get_upcoming_games();
      // await get_socials();
      // await get_game_profiles();
      // await get_user_joined_games();
      // await get_open_challenges();
      // await get_user_notifications();
    }
    init();
  }, []);

  // //============ Check App Version ============
  // useEffect(() => {

  //   checkVersion();
  // }, []);

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












  //============ Fade In Animation ============
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);





  //============ Initialize Notifications ============
  useEffect(() => {
    let mounted = true;

    const handleFCMCheckAndInit = async () => {
      if (isAuthenticated && (isCustomer || isAdmin) && isInitialized) {
        if (!mounted) return;

        // (re)initialize listeners & channels
        const isNotifyInitialized = await initializeNotifications();

        if (isNotifyInitialized) {
          await postFCMToken();
        }
      } else {
        // if user logs out -> cleanup listeners
        if (notificationUnsubscribeRef.current) {
          notificationUnsubscribeRef.current();
          notificationUnsubscribeRef.current = null;
        }
      }
    };

    handleFCMCheckAndInit();

    return () => {
      mounted = false;
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, isCustomer, isInitialized]);


  //============ Function to Initialize Notifications ============
  const initializeNotifications = async () => {
    try {
      const hasPermission = await requestNotificationPermission();

      // On lower Android (no prompt) -> hasPermission will still be true
      if (!hasPermission) return false;

      // Always try to get token
      const token = await getFCMToken();
      if (token) {
        await storeFCMToken(token);
      }

      // cleanup old listeners
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }

      // setup new listeners
      notificationUnsubscribeRef.current = await setupNotificationListeners();

      await setupNotificationChannel();

      return true;
    } catch (error) {
      if (__DEV__) {
        console.log('Notification initialization error:', error);
      }
      return false;
    }
  };








  //============ Handle Notification Taps ============
  // Notifee handles notification taps via onForegroundEvent and onBackgroundEvent
  // Navigation is handled in notificationService.js



  //============ Handle App State Changes ============
  useEffect(() => {
    if (isInitialized && getContent() !== null) {

      SplashScreen.hide();
    }
  }, [isInitialized, isAuthenticated, isAdmin, isCustomer]);

  //============ Content Renderer ============
  function getContent() {
    if (!isInitialized) return null;

    if (isAuthenticated) {
      return isCustomer ? <CustomerNavigator /> : isAdmin ? <AdminNavigator /> : null;
    }

    return <SignupNavigator />;
  }

  //============ Main Render ============
  return (

    updateRequired ? (
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
      <NoConnection onRetry={async () => {
        // Simple retry: if user is already initialized/auth flow started, try refetching minimal data
        try {
          await initializeTheme();
          await initAuth();
        } catch {}
      }} />
    )

  );
}

