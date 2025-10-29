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
  Keyboard
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
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
import { scaleWidth, scaleHeight } from '../../utils/scaling';


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

      <View style={[styles.container, {
        backgroundColor: colors.background,
        // paddingTop: insets.top
      }]}>
  {/* Header with logo */}
  <View style={[styles.headerContainer, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.headerContent]}>
            {
                  Platform.OS === 'ios' && (
                <Pressable style={[styles.backButton, { top: insets.top + scaleHeight(6) }]} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="chevron-back" size={scaleWidth(25)} color={'white'} />
                </Pressable>
                  )
            }

            
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/level.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={[styles.tagline, { color: colors.success }]}>level: eSport Matchmaking...</Text>
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
                <Ionicons 
                  name="mail-outline" 
                  size={scaleWidth(20)} 
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
                <Ionicons 
                  name="lock-closed-outline" 
                  size={scaleWidth(20)} 
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
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={scaleWidth(20)}
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
    </>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
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
    paddingBottom: scaleHeight(20),
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: scaleWidth(20),
    position: 'absolute',
    top: scaleHeight(10),
    left: 0,
    zIndex: 1,
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
    // marginBottom: scaleHeight(8),
  },
  tagline: {
    color: '#00C851',
    fontSize: scaleWidth(11),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(6),
  },
  taglineUnderline: {
    width: scaleWidth(60),
    height: scaleHeight(2),
    backgroundColor: '#00C851',
  },
  
  // Form Section Styles
  formSection: {
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
  inputFieldsContainer: {
    gap: scaleHeight(16),
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: scaleHeight(30),
  },
  inputContainer: {
    marginBottom: scaleHeight(0),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    paddingHorizontal: scaleWidth(15),
    height: scaleHeight(48),
  },
  inputIcon: {
    marginRight: scaleWidth(12),
  },
  input: {
    flex: 1,
    fontSize: scaleWidth(16),
    height: '100%',
  },
  eyeIcon: {
    padding: scaleWidth(5),
  },
  loginButton: {
    marginBottom: scaleHeight(0),
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    paddingVertical: scaleHeight(12),
    justifyContent: 'center',
    width: '100%',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(12),
  },
  loginButtonText: {
    fontSize: scaleWidth(16),
    fontWeight: '600',
  },
  inputWrapperError: {
    borderColor: '#ff4757',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4757',
    fontSize: scaleWidth(12),
    marginTop: scaleHeight(4),
    marginLeft: scaleWidth(15),
  },
})