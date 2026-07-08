import { StatusBar, StyleSheet, Text, View, Image, ScrollView, TextInput, Platform, Pressable, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import Toast from 'react-native-simple-toast';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import AppHeader from './header/AppHeader';
import { usePointsOut } from '../../queries/useMutation/usePointsOut';
import CoolButton from '../../component/customer/common/CoolButton';
import { AppIcon, PointsIcon } from '../../components/common/AppIcon';
import { QrCodeIcon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import { fontSize, spacing, radius, iconSize } from '../../theme/typography';

const PointsOut = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLight } = useThemeStore();
  const { mutateAsync: pointsOut } = usePointsOut();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#e0e0e0" : "#333333",
    inputBorder: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#f8f9fa" : "#1a1a1a",
    qrBg: isLight ? "#ffffff" : "#0a0a0a",
    cardBg: isLight ? "#f8f9fa" : "#0f0f0f",
  };

  const [crownAmount, setCrownAmount] = useState('');
  const [imageResult, setImageResult] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [disableBtn, setdisableBtn] = useState(false);
  const [errors, setErrors] = useState({
    amount: '',
    qr: ''
  });

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

  const validateFields = () => {
    const newErrors = {
      amount: '',
      qr: ''
    };

    if (!crownAmount) {
      newErrors.amount = 'Please enter points amount';
    } else if (parseInt(crownAmount) < 100) {
      newErrors.amount = 'Minimum 100 points';
    }

    if (!qrImage) {
      newErrors.qr = 'Please upload your QR code';
    }

    setErrors(newErrors);
    return !newErrors.amount && !newErrors.qr;
  };

  const handleSubmit = async () => {

    Keyboard.dismiss();
    if (!validateFields()) {
      return;
    }
    setdisableBtn(true)

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
      await pointsOut(formData);
      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'gamePoints' }
        ],
      });
    } catch (err) {
      Toast.show(err?.message || 'Failed to submit redeem request.', Toast.SHORT)
    } finally {
      setTimeout(() => {
        setdisableBtn(false)
      }, 2000)
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom - 55 : 0}

      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <AppHeader
              backButton={true}
              title={'Redeem Points'}
            />

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* Your QR Section */}
              <View style={styles.uploadContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Provide Your QR</Text>
                <Pressable
                  style={[
                    styles.uploadButton,
                    qrImage && styles.uploadButtonWithImage,
                    {
                      borderColor: errors.qr ? '#FF4444' : colors.inputBorder,
                      backgroundColor: colors.inputBg,
                    }
                  ]}
                  onPress={pickImage}
                >
                  {qrImage ? (
                    <View style={styles.selectedImageContainer}>
                      <Image source={{ uri: qrImage }} style={styles.selectedImage} />
                      <View style={styles.imageTextContainer}>
                        <Text style={[styles.imageFileName, { color: colors.text }]}>QR uploaded</Text>
                        <Text style={[styles.changeImageText, { color: colors.textSecondary }]}>Tap to change</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadButtonContent}>
                      <AppIcon icon={QrCodeIcon} size={iconSize.xl + 4} color={colors.textSecondary} />
                      <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>Tap to upload your QR</Text>
                    </View>
                  )}
                </Pressable>
                {errors.qr ? (
                  <View style={styles.errorContainer}>
                    <AppIcon icon={AlertCircleIcon} size={iconSize.xs} color="#FF4444" />
                    <Text style={styles.errorText}>{errors.qr}</Text>
                  </View>
                ) : null}
              </View>

              {/* Points Amount Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Redeem Point</Text>
                <View style={[styles.inputWrapper, {
                  borderColor: errors.amount ? '#FF4444' : colors.inputBorder,
                  backgroundColor: 'transparent',
                }]}> 
                  <View style={[
                    styles.pointsIconContainer,
                    { backgroundColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)' },
                    isLight && {
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4.5,
                    }
                  ]}>
                    <PointsIcon
                      size={iconSize.sm}
                      color={isLight ? "#ffffff" : "#20c997"}
                    />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter amount (e.g., 100)"
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
                </View>
                {errors.amount ? (
                  <View style={styles.errorContainer}>
                    <AppIcon icon={AlertCircleIcon} size={iconSize.xs} color="#FF4444" />
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  </View>
                ) : null}
              </View>

            </ScrollView>

            <View style={[styles.footer, Platform.OS === "android" && { marginBottom: spacing.sm }]}>
              <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Redeem'} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  )
}

export default PointsOut

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  uploadContainer: {
    marginBottom: spacing['2xl'] + 6,
  },
  inputLabel: {
    fontSize: fontSize.base + 1,
    fontWeight: "600",
    marginBottom: spacing.sm + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.pill - 7,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  pointsIconContainer: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: fontSize.base,
    fontSize: fontSize.md,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  uploadButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadButtonText: {
    fontSize: fontSize.base + 1,
    fontWeight: "500",
  },
  selectedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    gap: spacing.md,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  imageTextContainer: {
    flex: 1,
  },
  imageFileName: {
    fontSize: fontSize.base + 1,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  changeImageText: {
    fontSize: fontSize.sm + 1,
    fontWeight: "400",
  },
  uploadButtonWithImage: {
    justifyContent: "flex-start",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs + 2,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: '#FF4444',
  }
});