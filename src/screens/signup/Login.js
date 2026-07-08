import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Platform,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/common/AppIcon'
import { ArrowLeft01Icon, Mail01Icon, LockIcon, EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons'
import { useNavigation } from '@react-navigation/native'
import { useState, useEffect } from 'react'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated'
import { useAuthStore } from '../../store/authStore'
import * as yup from 'yup'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../store/themeStore'
import { postFCMToken } from '../../service/notificationService'
import { checkFCMTokenInStorage } from '../../utils/tokenUtils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { fontSize, spacing, iconSize } from '../../theme/typography';


// Define validation schema
const validationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .matches(/^[\x00-\x7F]*$/, 'No emojis allowed in email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/^[\x00-\x7F]*$/, 'No emojis allowed in password')
    .required('Password is required'),
});

const Login = () => {
  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();
  const { isLight } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Shared value for form section flex animation
  const formFlexValue = useSharedValue(1);

  const { login } = useAuthStore();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#555555" : "#999999",
    buttonBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
    buttonBorder: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.2)',
    inputBorder: isLight ? '#000000' : '#ffffff',
    success: '#00C851',
    headerBg: '#000000',
  };
  
  // Animated style for the form section
  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      flex: formFlexValue.value,
    };
  });
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        // Animate form flex from 1 to 2 when keyboard shows
        formFlexValue.value = withTiming(1.5, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        // Animate form flex back to 1 when keyboard hides
        formFlexValue.value = withTiming(1, {
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);




  // No Google sign-in config required in this screen








  //============ Handle Login ============
  async function handleLogin() {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    try {
      setIsLoading(true);
      // Reset errors
      setErrors({
        email: '',
        password: ''
      });

      // Validate form data
      await validationSchema.validate(credentials, { abortEarly: false });

      // If validation passes, proceed with login
      await login(credentials);

      // If there is a FCM Token while Login, Post it to the server
      const hasToken = await checkFCMTokenInStorage();
      if (hasToken) {
        await postFCMToken()
      }
    } catch (error) {
      // Check if it's a validation error
      if (error.name === 'ValidationError') {
        // Set field-specific errors
        const newErrors = { email: '', password: '' };
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
        
      } else {
        // Handle login API errors
        Toast.show(error?.message || 'Failed to sign in.', Toast.SHORT);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Validate single field on change
  const validateField = async (field, value) => {
    try {
      // Get the validation for just this field from the schema
      await yup.reach(validationSchema, field).validate(value);
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      // Set error message
      setErrors(prev => ({ ...prev, [field]: error.message }));
    }
  }

  // Handler for input changes with validation
  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        style={[styles.container, {
          backgroundColor: colors.background,
        }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Header with logo */}
            <View style={[styles.headerContainer, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.headerContent]}>
            {
                  Platform.OS === 'ios' && (
                <Pressable style={[styles.backButton, { top: insets.top + 6 }]} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <AppIcon icon={ArrowLeft01Icon} size={iconSize.xl} color="white" />
                </Pressable>
                  )
            }

            
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/leveloutlined.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={[styles.tagline, { color: colors.success }]}>Level eSports - Your gaming companion.</Text>
                <View style={[styles.taglineUnderline, { backgroundColor: colors.success }]} />
              </View>
            </View>
          </View>
            </View>

            {/* Login Form Section - Animated */}
            <Animated.View style={[
          styles.formSection, 
          {backgroundColor: colors.background},
          animatedFormStyle
        ]}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Enter your credentials to continue
            </Text>
          </View>

          <View style={styles.inputFieldsContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: colors.inputBorder,
                },
                errors.email ? styles.inputWrapperError : {}
              ]}>
                <AppIcon 
                  icon={Mail01Icon}
                  size={iconSize.md} 
                  color={errors.email ? "#ff4757" : "#00C851"} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textSecondary}
                  value={credentials.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: colors.inputBorder,
                },
                errors.password ? styles.inputWrapperError : {}
              ]}>
                <AppIcon 
                  icon={LockIcon}
                  size={iconSize.md} 
                  color={errors.password ? "#ff4757" : "#00C851"} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={credentials.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <AppIcon
                    icon={showPassword ? EyeIcon : EyeOffIcon}
                    size={iconSize.md}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Login Button */}
            <Pressable
              style={[styles.loginButton, {
                backgroundColor: colors.inputBorder,
                borderColor: colors.inputBorder,
              }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <View style={styles.loginButtonContent}>
                {isLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.loginButtonText, { color: colors.background }]}>
                    Sign In
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    flex: 1,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: spacing.xl,
    position: 'absolute',
    top: fontSize.xs,
    left: 0,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 150,
    // marginBottom: spacing.sm,
  },
  tagline: {
    color: '#00C851',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  taglineUnderline: {
    width: 60,
    height: spacing.xxs,
    backgroundColor: '#00C851',
  },
  
  // Form Section Styles
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  welcomeTextContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: spacing["2xl"],
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: spacing.xl,
  },
  inputFieldsContainer: {
    gap: spacing.lg,
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.lg,
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: spacing.lg,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    marginBottom: 0,
    borderRadius: spacing.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loginButtonText: {
    fontSize: spacing.lg,
    fontWeight: '600',
  },
  inputWrapperError: {
    borderColor: '#ff4757',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4757',
    fontSize: spacing.md,
    marginTop: spacing.xs,
    marginLeft: 15,
  },
})