import { StatusBar, StyleSheet, Text, View, Image, ScrollView, TextInput, Platform, Keyboard, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-simple-toast';
import * as ImagePicker from 'expo-image-picker';
import { TranscationAPI } from '../../api/transcationApi';
import { useQueryClient } from '@tanstack/react-query';
import AppHeader from './header/AppHeader';
import { useWithdraw } from '../../queries/useMutation/useWithdraw';
import CoolButton from '../../component/customer/common/CoolButton';

const WithDraw = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLight } = useThemeStore();
  const {mutateAsync: withdrawCrown} = useWithdraw();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#ffffff" : "#1a1a1a",
  };

  const [crownAmount, setCrownAmount] = useState('');
  const [imageResult, setImageResult] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const scrollViewRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [disableBtn, setdisableBtn] = useState(false);
  // Validation states
  const [errors, setErrors] = useState({
    amount: '',
    qr: ''
  });

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true)
        scrollViewRef.current?.scrollTo({
          y: Platform.OS === "ios" ? 500 : 700,
          animated: true,
        })
      },
    )

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false)
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        })
      },
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, []);

  // QR Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 1,
      });

      if (!result.canceled) {
        setImageResult(result.assets[0]);
        setQrImage(result.assets[0].uri);
        setErrors(prev => ({ ...prev, qr: '' })); // Clear QR error when image is selected
      }
    } catch (error) {
      Toast.show('Unable to pick QR image', Toast.SHORT);
    }
  };

  // Validate fields and update error states
  const validateFields = () => {
    const newErrors = {
      amount: '',
      qr: ''
    };

    if (!crownAmount) {
      newErrors.amount = 'Please enter crown amount';
    } else if (parseInt(crownAmount) < 100) {
      newErrors.amount = 'Minimum withdrawal amount is 100 crowns';
    }

    if (!qrImage) {
      newErrors.qr = 'Please upload your QR code';
    }

    setErrors(newErrors);
    return !newErrors.amount && !newErrors.qr;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    setdisableBtn(true)
    // Prepare form data
    const formData = new FormData();
    formData.append('crown_amount', crownAmount);
    if (imageResult) {
      formData.append('qr_image', {
        uri: qrImage,
        name: 'qr_code.jpg',
        type: imageResult.mimeType || 'image/jpeg'
      });
    }

       try {
      await withdrawCrown(formData);
      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'transaction' }
        ],
      });
    } catch (err) {
      Toast.show(err?.message || 'Failed to submit credit request.', Toast.SHORT)
    } finally {
      setTimeout(() => {
        setdisableBtn(false)
      }, 2000)
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={'light-content'} />

      <View style={[styles.container, {
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,

      }]}>

        {/* Full-width header with wallet-style curve */}
        <View style={styles.headerContainer}>
          {/* Main header content */}
          <View style={[styles.headerContent, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : insets.top }]}>
            <Pressable style={{ alignSelf: 'flex-start', marginLeft: 10 }} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={25} color={'white'} />
            </Pressable>
            <View style={styles.logoContainerInner}>
              {/* Left Crown */}
              <View style={styles.crownWrapper}>
                <MaterialCommunityIcons
                  name="crown"
                  size={65}
                  color="#00C851"
                  style={{ transform: [{ rotate: "-15deg" }] }}
                />
              </View>

              {/* Logo with Enhanced Styling */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/level.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.tagline}>Level Up Your Real Wallet</Text>
                <View style={styles.taglineUnderline} />
              </View>

              {/* Right Crown */}
              <View style={styles.crownWrapper}>
                <MaterialCommunityIcons
                  name="crown"
                  size={65}
                  color="#00C851"
                  style={{ transform: [{ rotate: "15deg" }] }}
                />
              </View>
            </View>
          </View>

          {/* Curved bottom edge */}
          <View style={styles.curveContainer}>
            <View style={[styles.curve, { backgroundColor: colors.background }]} />
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && { paddingBottom: 300 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* QR Upload Section */}
          <Pressable
            style={[
              styles.qrContainer,
              qrImage ? styles.qrContainerWithImage : styles.qrContainerEmpty
            ]}
            onPress={pickImage}
          >
            {qrImage ? (
              <Image
                source={{ uri: qrImage }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.uploadContent}>
                <Ionicons name="cloud-upload-outline" size={50} color="#00C851" />
                <Text style={styles.uploadButtonText}>Upload Your QR Code</Text>
                <Text style={styles.uploadSubtext}>Tap to select from gallery</Text>
              </View>
            )}
          </Pressable>
          {errors.qr ? (
            <Text style={[styles.errorText, { color: '#FF4444', textAlign: 'center', marginTop: 8 }]}>{errors.qr}</Text>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.labelCrownContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Enter Amount (Minimum 100)</Text>
              </View>
              <TextInput
                style={[styles.input, {
                  borderColor: colors.border,
                  backgroundColor: colors.inputBg,
                  color: colors.text
                }]}
                placeholder="eg. 100"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={crownAmount}
                onChangeText={(text) => {
                  setCrownAmount(text);
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: '' }));
                  }
                }}
              />
              {errors.amount ? (
                <Text style={[styles.errorText, { color: '#FF4444', marginTop: 4 }]}>{errors.amount}</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Submit Withdrawal'} />
        </View>
      </View>
    </>
  )
}

export default WithDraw

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#000000',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  curveContainer: {
    height: 50,
    overflow: 'hidden',
    marginTop: -1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  curve: {
    height: 30,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 1,
    borderColor: '#00C851',
    borderBottomWidth: 0,
  },
  logoContainerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  crownWrapper: {
    padding: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  tagline: {
    color: '#00C851',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 4,
  },
  taglineUnderline: {
    width: 80,
    height: 2,
    backgroundColor: '#00C851',
    marginTop: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  logo: {
    width: 150,
    height: 90,
    marginBottom: 5,
  },
  formContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  labelCrownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  qrContainer: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainerEmpty: {
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
    borderWidth: 1,
    borderColor: '#00C851',
    borderStyle: 'dashed',
  },
  qrContainerWithImage: {
    backgroundColor: '#f8f9fa',
    borderWidth: 0,
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadButtonText: {
    fontSize: 18,
    color: '#00C851',
    fontWeight: '600',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  }
});