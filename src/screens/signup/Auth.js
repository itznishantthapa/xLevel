import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as yup from 'yup';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  AppleIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  Mail01Icon,
} from '@hugeicons/core-free-icons';
import Toast from 'react-native-simple-toast';

import { AppIcon } from '../../components/common/AppIcon';
import { AuthAmbientDecor, AuthButtonFrameDecor } from '../../components/auth/AuthDecorations';
import CoolButton from '../../component/customer/common/CoolButton';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { fontSize, iconSize, radius, spacing } from '../../theme/typography';
import { getAuthMetadata } from '../../utils/authMetadata';

const GOOGLE_WEB_CLIENT_ID =
  '901665380294-lhur8lkcqkdt1d0e9b5q3p25mknfejbs.apps.googleusercontent.com';

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const AUTH_CONTROL_HEIGHT = 48;
const AUTH_CONTROL_RADIUS = radius.lg;
const AUTH_CONTROL_GAP = spacing.md;

const emailSchema = yup
  .string()
  .trim()
  .email('Please enter a valid email')
  .matches(/^[\x00-\x7F]*$/, 'Email cannot contain emojis')
  .required('Email is required');

const passwordSchema = yup
  .string()
  .required('Password is required')
  .test('no-emoji', 'Password cannot contain emojis', (value) => !value || !EMOJI_REGEX.test(value));

const loginSchema = yup.object({
  email: emailSchema,
  password: passwordSchema,
});

const mapYupErrors = (err) => {
  const fieldErrors = {};
  err.inner.forEach(({ path, message }) => {
    if (path) fieldErrors[path] = message;
  });
  return fieldErrors;
};

const getApiErrorMessage = (err, fallback) => err?.message || fallback;

const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  secureTextEntry,
  onToggleSecure,
  secureVisible,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize = 'none',
  keyboardType = 'default',
  colors,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;
  const isFloating = isFocused || value.length > 0;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [animation, isFloating]);

  const labelTop = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [12, -9],
  });

  const labelFontSize = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });

  return (
    <View style={styles.inputGroup}>
      <View
        style={[
          styles.inputShell,
          {
            borderColor: error ? colors.error : isFocused ? colors.text : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <AppIcon
          icon={icon}
          size={iconSize.md}
          color={isFocused ? colors.text : colors.textMuted}
          strokeWidth={1.5}
        />

        <View style={styles.inputBody}>
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: isFocused ? colors.text : colors.textMuted,
                backgroundColor: colors.surface,
              },
            ]}
            pointerEvents="none"
          >
            {label}
          </Animated.Text>

          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            placeholder=""
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={8} style={styles.eyeButton}>
            <AppIcon
              icon={secureVisible ? EyeIcon : EyeOffIcon}
              size={iconSize.md}
              color={colors.textMuted}
              strokeWidth={1.5}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const Auth = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore();
  const { isConnected } = useNetworkStatus();
  const { login, google_signup, apple_signup } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [visibility, setVisibility] = useState({
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    surface: isLight ? '#ffffff' : '#000000',
    text: isLight ? '#111111' : '#f5f5f5',
    textMuted: isLight ? '#888888' : '#888888',
    border: isLight ? '#e8e8e8' : 'rgba(255, 255, 255, 0.14)',
    divider: isLight ? '#ececec' : 'rgba(255, 255, 255, 0.12)',
    stroke: isLight ? '#000000' : '#ffffff',
    error: '#FF4444',
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    GoogleSignin.configure({
      scopes: ['email'],
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const validateField = async (field, snapshot) => {
    try {
      await loginSchema.validateAt(field, {
        email: snapshot.email.trim(),
        password: snapshot.password,
      });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors((prev) => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const updateForm = (field) => (value) => {
    const nextValue = field === 'email' ? value.trimStart().toLowerCase() : value;

    setForm((prev) => {
      const next = { ...prev, [field]: nextValue };
      validateField(field, next);
      return next;
    });
  };

  const toggleVisibility = (field) => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLogin = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    try {
      await loginSchema.validate(payload, { abortEarly: false });
      setIsSubmitting(true);
      const authMetadata = await getAuthMetadata();
      await login({ ...payload, ...authMetadata });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors(mapYupErrors(err));
      } else {
        const message = getApiErrorMessage(err, 'Unable to log in.');
        if (message === INVALID_CREDENTIALS_MESSAGE) {
          setErrors({ email: '', password: message });
        } else {
          Toast.show(message, Toast.SHORT);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    try {
      setIsGoogleLoading(true);
      const authMetadata = await getAuthMetadata();
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();
      if (!userInfo?.data?.idToken) {
        return;
      }

      await google_signup({
        id_token: userInfo.data.idToken,
        ...authMetadata,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Google Sign-In Error:', error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
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
        Toast.show('Apple Sign-In failed.', Toast.SHORT);
        return;
      }

      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      await apple_signup({
        id_token: credential.identityToken,
        email: credential.email,
        full_name: fullName,
      });
    } catch (err) {
      if (__DEV__) {
        console.error('Apple Sign-In Error:', err);
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const isAndroid = Platform.OS === 'android';
  const isOAuthBusy = isGoogleLoading || isAppleLoading;

  const handleOpenTerms = () => {
    navigation.navigate('legalDocument', { type: 'terms' });
  };

  const handleOpenPrivacy = () => {
    navigation.navigate('legalDocument', { type: 'privacy' });
  };

  const renderOAuthButton = ({ id, icon, label, onPress, loading, disabled }) => (
    <Pressable
      key={id}
      style={[
        styles.oauthButton,
        {
          borderColor: colors.stroke,
          backgroundColor: colors.surface,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.oauthButtonContent}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <AppIcon icon={icon} size={iconSize.md} color={colors.text} />
        )}
        <Text style={[styles.oauthButtonText, { color: colors.text }]}>{label}</Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + spacing['3xl'],
                paddingBottom: Math.max(insets.bottom + spacing.xl, spacing['3xl']),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <AuthAmbientDecor stroke={colors.stroke} />

              <View style={styles.brandBlock}>
                <View
                  style={[
                    styles.logoMark,
                    {
                      backgroundColor: isLight ? '#111111' : '#ffffff',
                    },
                  ]}
                >
                  <Image
                    source={require('../../assets/level.png')}
                    style={[
                      styles.logo,
                      !isLight && { tintColor: '#000000' },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.brandTaglineWrap}>
                  <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                    Your good gaming companion
                  </Text>
                  <View style={[styles.brandTaglineUnderline, { backgroundColor: colors.stroke }]} />
                </View>
              </View>

              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {isAndroid
                    ? 'Sign in or create an account with Google.'
                    : 'Sign in to continue.'}
                </Text>
              </View>

              {isAndroid ? (
                <View style={styles.authSection}>
                  <AuthButtonFrameDecor stroke={colors.stroke}>
                    {renderOAuthButton({
                      id: 'google',
                      icon: GoogleIcon,
                      label: 'Continue with Google',
                      onPress: handleGoogleSignIn,
                      loading: isGoogleLoading,
                      disabled: isOAuthBusy,
                    })}
                  </AuthButtonFrameDecor>

                  <Text style={[styles.legalText, styles.authLegalText, { color: colors.textMuted }]}>
                    By continuing, you agree to our{' '}
                    <Text style={[styles.legalLink, { color: colors.text }]} onPress={handleOpenTerms}>
                      Terms
                    </Text>
                    {' '}and{' '}
                    <Text style={[styles.legalLink, { color: colors.text }]} onPress={handleOpenPrivacy}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              ) : (
                <View style={styles.authControls}>
                  <FloatingInput
                    label="Email"
                    value={form.email}
                    onChangeText={updateForm('email')}
                    icon={Mail01Icon}
                    error={typeof errors.email === 'string' ? errors.email : ''}
                    keyboardType="email-address"
                    returnKeyType="next"
                    colors={colors}
                  />

                  <FloatingInput
                    label="Password"
                    value={form.password}
                    onChangeText={updateForm('password')}
                    icon={LockIcon}
                    error={errors.password}
                    secureTextEntry={!visibility.password}
                    secureVisible={visibility.password}
                    onToggleSecure={() => toggleVisibility('password')}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    colors={colors}
                  />

                  <CoolButton
                    title="Log In"
                    handlePress={handleLogin}
                    disableBtn={isSubmitting}
                    disabled={isSubmitting || isOAuthBusy}
                    style={styles.primaryButton}
                    textStyle={styles.primaryButtonText}
                  />

                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                    <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                  </View>

                  <AuthButtonFrameDecor stroke={colors.stroke}>
                    {renderOAuthButton({
                      id: 'apple',
                      icon: AppleIcon,
                      label: 'Continue with Apple',
                      onPress: handleAppleSignIn,
                      loading: isAppleLoading,
                      disabled: isOAuthBusy || isSubmitting,
                    })}
                  </AuthButtonFrameDecor>

                  <Text style={[styles.legalText, styles.authLegalText, { color: colors.textMuted }]}>
                    By continuing, you agree to our{' '}
                    <Text style={[styles.legalLink, { color: colors.text }]} onPress={handleOpenTerms}>
                      Terms
                    </Text>
                    {' '}and{' '}
                    <Text style={[styles.legalLink, { color: colors.text }]} onPress={handleOpenPrivacy}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['3xl'],
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
  },
  authSection: {
    gap: spacing['2xl'],
    marginTop: spacing.sm,
  },
  authLegalText: {
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing['3xl'] + spacing.sm,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
  },

  brandTaglineWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTagline: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  brandTaglineUnderline: {
    height: 2,
    width: 148,
    borderRadius: radius.full,
  },
  header: {
    marginBottom: spacing['2xl'] + spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  authControls: {
    gap: AUTH_CONTROL_GAP,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AUTH_CONTROL_HEIGHT,
    borderWidth: 1,
    borderRadius: AUTH_CONTROL_RADIUS,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  inputBody: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: spacing.xs,
    marginLeft: -spacing.xs,
  },
  textInput: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    fontSize: fontSize.md,
    lineHeight: fontSize.md + 2,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.sm,
    paddingLeft: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  oauthButton: {
    height: AUTH_CONTROL_HEIGHT,
    borderRadius: AUTH_CONTROL_RADIUS,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  oauthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  oauthButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  legalText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: AUTH_CONTROL_HEIGHT,
    paddingVertical: 0,
    borderRadius: AUTH_CONTROL_RADIUS,
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default Auth;
