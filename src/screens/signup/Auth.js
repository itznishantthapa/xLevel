import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, FontAwesome6 } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-simple-toast';

// Store imports
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

// Hook imports
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

// Service imports
import { postFCMToken } from '../../service/notificationService';
import { checkFCMTokenInStorage } from '../../utils/tokenUtils';

// API Queries
import { useBanners } from '../../queries/useBanners';
import { useUtils } from '../../queries/useUtils';
import { scaleWidth, scaleHeight } from '../../utils/scaling';

// Constants
const GOOGLE_WEB_CLIENT_ID = "901665380294-lhur8lkcqkdt1d0e9b5q3p25mknfejbs.apps.googleusercontent.com";
const PRIVACY_URL = "https://level.com.np/privacy";
const TERMS_URL = "https://level.com.np/terms";

const Auth = () => {
  // Hooks
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { google_signup, apple_signup, login } = useAuthStore();


  // Global state management
  const { isLight } = useThemeStore()
  const { isConnected } = useNetworkStatus()

  // API data queries
  const { data: banners = [] } = useBanners()
  const {data: utils = []} = useUtils()

  const shouldShowEmailLogin = !utils?.is_ios_active;

  // State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  // Theme colors
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#555555" : "#999999",
    buttonBackground: 'transparent',
    buttonBorder: isLight ? '#000000' : '#ffffff',
    authSectionBg: isLight ? '#ffffff' : '#1e1e1e',
    error: '#FF4444',
    success: '#00C851',
    headerBg: '#000000'
  };

  // Initialize Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['email'],
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  // Authentication Functions
  const handleGoogleSignIn = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut(); // Clear existing sessions

      const userInfo = await GoogleSignin.signIn();

      if (!userInfo?.data?.idToken) {
        return;
      }

      const payload = { id_token: userInfo.data.idToken };
      await google_signup(payload);

      // Handle FCM token if available
      const hasToken = await checkFCMTokenInStorage();
      if (hasToken) {
        await postFCMToken();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Google Sign-In Error:', error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };



  const handleEmailLogin = () => {
    navigation.navigate('login');
  };

  const handleAppleSignIn = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }
    try {
      setIsAppleLoading(true);
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential?.identityToken) {
        Toast.show('Apple Sign-In failed.');
        return;
      }

      const fullName = credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : undefined;
      const payload = {
        id_token: credential.identityToken,
        email: credential.email, // optional per backend spec
        full_name: fullName // optional
      };

      console.log("apple payload:", payload);

      await apple_signup(payload);
      const hasToken = await checkFCMTokenInStorage();
      if (hasToken) {
        await postFCMToken();
      }
    } catch (err) {
      // if (err?.code === 'ERR_REQUEST_CANCELED') return; // user canceled
      // if (__DEV__) console.error('Apple Sign-In Error:', err);

    } finally {
      setIsAppleLoading(false);
    }
  };

  // Auth buttons configuration
  const getAuthButtons = () => {
    const buttons = [
      {
        id: 'google',
        icon: isGoogleLoading ?
          <ActivityIndicator size="small" color={colors.text} /> :
          <AntDesign name="google" size={scaleWidth(20)} color={colors.text} />,
        text: 'Continue with Google',
        onPress: handleGoogleSignIn,
        disabled: isGoogleLoading
      }
    ];

    if (Platform.OS === 'ios') {
      buttons.push({
        id: 'apple',
        icon: isAppleLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <AntDesign name="apple1" size={scaleWidth(20)} color={colors.text} />
        ),
        text: 'Continue with Apple',
        onPress: handleAppleSignIn,
        disabled: isAppleLoading
      });
    }




    if (Platform.OS === 'ios' && shouldShowEmailLogin) {
      buttons.push({
        id: 'email',
        icon: <FontAwesome6 name="envelope" size={scaleWidth(20)} color={colors.text} />,
        text: 'Continue with Email',
        onPress: handleEmailLogin,
        disabled: false
      });
    }



    return buttons;
  };

  // Component Renderers
  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.headerBg }]}>
      <View style={styles.headerContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/level.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.tagline, { color: colors.success }]}>
              Level eSports
            </Text>
            <View style={[styles.taglineUnderline, { backgroundColor: colors.success }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderAuthButtons = () => (
    <View style={styles.buttonsContainer}>
      {getAuthButtons().map((button) => (
        <Pressable
          key={button.id}
          style={[styles.authButton, {
            backgroundColor: colors.buttonBackground,
            borderColor: colors.buttonBorder,
          }]}
          onPress={button.onPress}
          disabled={button.disabled}
        >
          <View style={styles.buttonContent}>
            {button.icon}
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {button.text}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const handleOpenTerms = () => {
    Linking.openURL(TERMS_URL).catch(err => {
      if (__DEV__) console.error('Error opening terms URL:', err);
      Toast.show('Could not open Terms of Service', Toast.SHORT);
    });
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(err => {
      if (__DEV__) console.error('Error opening privacy URL:', err);
      Toast.show('Could not open Privacy Policy', Toast.SHORT);
    });
  };

  const renderTermsAndPrivacy = () => (
    <View style={styles.termsContainer}>
      <Text style={[styles.termsText, { color: colors.textSecondary }]}>
        <Text>By continuing, you agree to our </Text>
        <Text
          style={[styles.termsLink, { color: colors.success }]}
          onPress={handleOpenTerms}
        >
          Terms of Service
        </Text>
        <Text> and </Text>
        <Text
          style={[styles.termsLink, { color: colors.success }]}
          onPress={handleOpenPrivacy}
        >
          Privacy Policy
        </Text>
      </Text>
    </View>
  );

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}

        <View style={[styles.authSection, { backgroundColor: colors.authSectionBg }]}>
          <View style={styles.welcomeTextContainer}>
            <Text 
              style={[styles.welcomeTitle, { color: colors.text }]}
              numberOfLines={1} 
              adjustsFontSizeToFit={true}
            >
              You're Welcome
            </Text>
            <Text 
              style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}
              numberOfLines={2} 
              adjustsFontSizeToFit={true}
            >
              Choose your preferred sign-in method
            </Text>
          </View>

          {renderAuthButtons()}
          {renderTermsAndPrivacy()}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    flex: 1
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: scaleHeight(20),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: scaleWidth(180),
    height: scaleHeight(80),
  },
  tagline: {
    fontSize: scaleWidth(11),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(6),
  },
  taglineUnderline: {
    width: scaleWidth(60),
    height: scaleHeight(2),
  },

  // Auth Section Styles
  authSection: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
    justifyContent: 'center',
    gap: scaleHeight(20),
  },
  welcomeTextContainer: {
    alignItems: 'center',
    minHeight: scaleHeight(60), // Fixed height to prevent collapse
  },
  welcomeTitle: {
    fontSize: scaleWidth(24),
    fontWeight: '700',
    marginBottom: scaleHeight(6),
    includeFontPadding: false,
    textAlign: 'center',
    minHeight: scaleHeight(30), // Fixed height for stable animation
    textAlignVertical: 'center',
  },
  welcomeSubtitle: {
    fontSize: scaleWidth(14),
    textAlign: 'center',
    lineHeight: scaleHeight(20),
    includeFontPadding: false,
  },
  buttonsContainer: {
    gap: scaleHeight(16),
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: scaleHeight(30),
  },
  authButton: {
    borderRadius: scaleWidth(16),
    borderWidth: 1.5,
    paddingVertical: scaleHeight(12),
    justifyContent: 'center',
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(12),
  },
  buttonText: {
    fontSize: scaleWidth(16),
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: scaleWidth(10),
  },
  termsText: {
    fontSize: scaleWidth(12),
    textAlign: 'center',
    lineHeight: scaleHeight(18),
  },
  termsLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default Auth;