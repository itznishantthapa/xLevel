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
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
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
import { scaleWidth, scaleHeight } from '../../utils/scaling';

// Constants
const GOOGLE_WEB_CLIENT_ID = "901665380294-lhur8lkcqkdt1d0e9b5q3p25mknfejbs.apps.googleusercontent.com";
const MINIMUM_AGE = 18;
const DEFAULT_DATE = new Date(2000, 0, 1);
const PRIVACY_URL = "https://level.com.np/privacy";
const TERMS_URL = "https://level.com.np/terms";

// Animation configuration
const ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.cubic)
};

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


  const shouldShowEmailLogin = banners.length === 0 || banners.some(banner => banner?.url && banner.url.toLowerCase().includes('point'));




  // State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false); // New state for 'Verified' text
  const [date, setDate] = useState(DEFAULT_DATE);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [ageError, setAgeError] = useState('');
  const [tempDate, setTempDate] = useState(DEFAULT_DATE);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  // Animation values
  const ageVerificationOpacity = useSharedValue(1);
  const ageVerificationTranslateY = useSharedValue(0);
  const authSectionOpacity = useSharedValue(0);
  const authSectionTranslateY = useSharedValue(30);
  const titleOpacity = useSharedValue(1);
  const titleScale = useSharedValue(1);
  const confirmButtonOpacity = useSharedValue(0);
  const confirmButtonScale = useSharedValue(0.8);

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

  // Utility Functions
  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Animation Functions
  const animateToWelcomeScreen = () => {
    // Step 0: Wait for 0.3 seconds before starting verification animation
    setTimeout(() => {
      // Step 1: Show "Verified ✓" with celebration animation
      titleScale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
      );

      // Update to verified state
      setTimeout(() => {
        runOnJS(setIsVerificationComplete)(true);
      }, 100);

      // Step 2: After showing "Verified", fade out age verification section
      setTimeout(() => {
        ageVerificationOpacity.value = withTiming(0, ANIMATION_CONFIG);
        ageVerificationTranslateY.value = withTiming(-20, ANIMATION_CONFIG);
      }, 1200); // Show "Verified" for 1.2 seconds

      // Step 3: Animate title to "You're Welcome" and show auth section
      setTimeout(() => {
        // Animate title change
        titleScale.value = withSequence(
          withTiming(1.05, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );

        runOnJS(setIsAgeVerified)(true);

        // Animate in the auth section with slight delay
        authSectionOpacity.value = withDelay(150,
          withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.cubic)
          })
        );

        authSectionTranslateY.value = withDelay(150,
          withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.cubic)
          })
        );
      }, 1500); // Total delay before showing welcome screen
    }, 300); // Wait 0.3 seconds before starting verification animation
  };

  const animateConfirmButton = (show) => {
    confirmButtonOpacity.value = withTiming(show ? 1 : 0, {
      duration: show ? 300 : 200,
      easing: show ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic)
    });
    confirmButtonScale.value = withTiming(show ? 1 : 0.8, {
      duration: show ? 300 : 200,
      easing: show ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic)
    });
  };

  // Age Verification Functions
  const validateAndProceed = (selectedDate) => {
    const age = calculateAge(selectedDate);

    if (age >= MINIMUM_AGE) {
      setAgeError('');
      animateToWelcomeScreen();
    } else {
      setAgeError(`You must be ${MINIMUM_AGE} or older to use this application`);
      setIsAgeVerified(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);

      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
        validateAndProceed(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
        setShowConfirmButton(true);
        setAgeError('');
        animateConfirmButton(true);
      }
    }
  };

  const handleConfirmDate = () => {
    animateConfirmButton(false);

    setTimeout(() => {
      setDate(tempDate);
      setShowConfirmButton(false);
      validateAndProceed(tempDate);
    }, 200);
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

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




    if (Platform.OS === 'ios' && !shouldShowEmailLogin) {
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

  // Animated styles
  const ageVerificationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ageVerificationOpacity.value,
    transform: [{ translateY: ageVerificationTranslateY.value }]
  }));

  const authSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: authSectionOpacity.value,
    transform: [{ translateY: authSectionTranslateY.value }]
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }]
  }));

  const confirmButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confirmButtonOpacity.value,
    transform: [{ scale: confirmButtonScale.value }]
  }));

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
              level: eSport Matchmaking...
            </Text>
            <View style={[styles.taglineUnderline, { backgroundColor: colors.success }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={[styles.authButton, styles.iosDatePickerContainer, {
          backgroundColor: colors.buttonBackground,
          borderColor: colors.buttonBorder,
        }]}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="compact"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            style={styles.iosDatePicker}
            textColor={colors.text}
            accentColor={colors.text}
            themeVariant={isLight ? 'light' : 'dark'}
          />
        </View>
      );
    }

    return (
      <>
        <Pressable
          style={[styles.authButton, {
            backgroundColor: colors.buttonBackground,
            borderColor: colors.buttonBorder,
          }]}
          onPress={showDatePicker}
        >
          <View style={styles.buttonContent}>

            <Text style={[styles.buttonText, { color: colors.text }]}>
              {formatDate(date)}
            </Text>
          </View>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </>
    );
  };

  const renderConfirmButton = () => {
    if (Platform.OS !== 'ios' || !showConfirmButton) return null;

    return (
      <Animated.View style={confirmButtonAnimatedStyle}>
        <Pressable
          style={[styles.authButton, {
            backgroundColor: colors.buttonBorder,
            borderColor: colors.buttonBorder,
            marginTop: scaleHeight(16),
            justifyContent: 'center',
            alignItems: 'center',
          }]}
          onPress={handleConfirmDate}
        >
          <Text style={[styles.buttonText, {
            color: colors.background,
            fontWeight: '600',
            textAlign: 'center'
          }]}>
            Confirm Date
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderAgeVerification = () => (
    <Animated.View style={[styles.ageVerificationContainer, ageVerificationAnimatedStyle]}>
      <View style={styles.datePickerContainer}>
        {renderDatePicker()}
      </View>
      {renderConfirmButton()}
      {ageError ? (
        <Text style={[styles.ageErrorText, { color: colors.error }]}>
          {ageError}
        </Text>
      ) : null}
    </Animated.View>
  );

  const renderAuthButtons = () => (
    <Animated.View style={[styles.buttonsContainer, authSectionAnimatedStyle]}>
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
    </Animated.View>
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
        {isAgeVerified ? (
          <>
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
          </>
        ) : (
          `You must be ${MINIMUM_AGE} or older to use this application`
        )}
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
            <Animated.Text style={[styles.welcomeTitle, { color: colors.text }, titleAnimatedStyle]}>
              {isAgeVerified ? "You're Welcome" : (isVerificationComplete ? "Verified ✓" : "Verify Your Age")}
            </Animated.Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              {isAgeVerified
                ? "Choose your preferred sign-in method"
                : "Please select your date of birth to continue"
              }
            </Text>
          </View>

          {isAgeVerified ? renderAuthButtons() : renderAgeVerification()}
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
  },
  welcomeTitle: {
    fontSize: scaleWidth(24),
    fontWeight: '700',
    marginBottom: scaleHeight(6),
  },
  welcomeSubtitle: {
    fontSize: scaleWidth(14),
    textAlign: 'center',
    lineHeight: scaleHeight(20),
  },
  buttonsContainer: {
    gap: scaleHeight(16),
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: scaleHeight(30),
  },
  authButton: {
    borderRadius: scaleWidth(16),
    borderWidth: 1,
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

  // Age Verification Styles
  ageVerificationContainer: {
    gap: scaleHeight(16),
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: scaleHeight(30),
  },
  datePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosDatePickerContainer: {
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleHeight(48),
  },
  iosDatePicker: {
    width: '100%',
    height: scaleHeight(36),
    alignSelf: 'flex-start',
  },
  ageErrorText: {
    fontSize: scaleWidth(14),
    textAlign: 'center',
    fontWeight: '500',
    marginTop: scaleHeight(8),
  },
});

export default Auth;