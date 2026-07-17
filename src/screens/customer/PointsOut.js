import { StatusBar, StyleSheet, Text, View, Image, ScrollView, TextInput, Platform, Pressable, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useMemo, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import Toast from 'react-native-simple-toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import AppHeader from './header/AppHeader';
import { usePointsOut } from '../../queries/useMutation/usePointsOut';
import CoolButton from '../../component/customer/common/CoolButton';
import { AppIcon, PointsIcon } from '../../components/common/AppIcon';
import { QrCodeIcon, AlertCircleIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { fontSize, spacing, radius, iconSize } from '../../theme/typography';

const QR_PAYMENT_ICONS = [
  require('../../assets/esewa.png'),
  require('../../assets/khalti.png'),
];

const QR_PAYMENT_AVATAR_SIZE = spacing['3xl'];
const QR_PAYMENT_AVATAR_OVERLAP = -10;

const PointsOut = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLight } = useThemeStore();
  const { user } = useAuthStore();
  const { mutateAsync: pointsOut } = usePointsOut();

  const wonBalance = useMemo(() => {
    const balance = user?.won_balance ?? 0;
    return typeof balance === 'number' ? balance.toFixed(2) : String(balance);
  }, [user?.won_balance]);

  const walletBalance = useMemo(() => {
    const balance = user?.wallet_balance ?? 0;
    return typeof balance === 'number' ? balance.toFixed(2) : String(balance);
  }, [user?.wallet_balance]);

  const balanceFontSize = useMemo(() => {
    const digitCount = wonBalance.replace('.', '').length;
    if (digitCount <= 4) return 76;
    if (digitCount <= 6) return 64;
    if (digitCount <= 8) return 52;
    return 44;
  }, [wonBalance]);

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#e0e0e0" : "#333333",
    inputBorder: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#f8f9fa" : "#1a1a1a",
    qrBg: isLight ? "#ffffff" : "#0a0a0a",
    cardBg: isLight ? "#f8f9fa" : "#0f0f0f",
    cardBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
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

              <View style={styles.balanceHero}>
                <View style={styles.balanceAmountInner}>
                  <Text style={[styles.balanceOutOf, { color: colors.text }]}>
                    out of{' '}
                    <Text style={styles.balanceOutOfValue}>{walletBalance}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      {
                        color: colors.text,
                        fontSize: balanceFontSize,
                        letterSpacing: balanceFontSize * -0.03,
                      },
                    ]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.55}
                  >
                    {wonBalance}
                  </Text>
                </View>
                <View style={styles.balanceLabelWrap}>
                  <Text
                    style={[
                      styles.balanceLabel,
                      { color: isLight ? '#000000' : '#ffffff' },
                    ]}
                  >
                    Your Won Points
                  </Text>
                  <View style={styles.balanceUnderlineWrap}>
                    <View style={styles.balanceUnderline}>
                      <View
                        style={[
                          styles.balanceUnderlineLine,
                          { backgroundColor: isLight ? '#000000' : '#ffffff' },
                        ]}
                      />
                      <View style={styles.balanceUnderlineJewel}>
                        <PointsIcon size={iconSize.sm + 2} color="#00bf63" />
                      </View>
                      <View
                        style={[
                          styles.balanceUnderlineLine,
                          { backgroundColor: isLight ? '#000000' : '#ffffff' },
                        ]}
                      />
                    </View>
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 191, 99, 0.55)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.balanceUnderlineGlow}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.infoHeader}>
                  <AppIcon icon={InformationCircleIcon} size={iconSize.md} color={colors.text} />
                  <Text style={[styles.infoTitle, { color: colors.text }]}>
                    Redeem Info
                  </Text>
                </View>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Only won game point is redeemable.
                </Text>
              </View>

              {/* Your QR Section */}
              <View style={styles.uploadContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Provide Your QR</Text>
                <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                  Upload your eSewa or Khalti QR code
                </Text>
                <View style={styles.uploadButtonWrapper}>
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
                        <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                          Tap to upload eSewa or Khalti QR
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.qrPaymentAvatarBadge} pointerEvents="none">
                    {QR_PAYMENT_ICONS.map((source, index) => (
                      <View
                        key={index}
                        style={[
                          styles.qrPaymentAvatar,
                          {
                            marginLeft: index === 0 ? 0 : QR_PAYMENT_AVATAR_OVERLAP,
                            zIndex: QR_PAYMENT_ICONS.length - index,
                            borderColor: colors.inputBg,
                          },
                        ]}
                      >
                        <Image source={source} style={styles.qrPaymentAvatarImage} resizeMode="cover" />
                      </View>
                    ))}
                  </View>
                </View>
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
                    placeholder="Enter amount ( min. 100 points )"
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
                <Text style={[styles.redeemHint, { color: colors.textSecondary }]}>
                  &quot;You can redeem only one time per day.&quot;
                </Text>
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
    paddingTop: spacing.md,
  },
  balanceHero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  balanceAmountInner: {
    alignSelf: 'center',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  balanceAmount: {
    fontWeight: Platform.OS === 'ios' ? '200' : '300',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  balanceOutOf: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
  },
  balanceOutOfValue: {
    fontWeight: '700',
    color: '#00bf63',
    textDecorationLine: 'underline',
    textDecorationColor: '#00bf63',
  },
  balanceLabelWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm + 2,
  },
  balanceLabel: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  balanceUnderlineWrap: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.xs,
  },
  balanceUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 156,
  },
  balanceUnderlineLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.full,
    opacity: 0.28,
  },
  balanceUnderlineJewel: {
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceUnderlineGlow: {
    width: 72,
    height: 3,
    borderRadius: radius.full,
  },
  infoCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  infoText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  uploadContainer: {
    marginBottom: spacing['2xl'] + 6,
  },
  uploadButtonWrapper: {
    position: 'relative',
  },
  uploadHint: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.sm + 2,
    marginTop: -spacing.xs,
  },
  qrPaymentAvatarBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrPaymentAvatar: {
    width: QR_PAYMENT_AVATAR_SIZE,
    height: QR_PAYMENT_AVATAR_SIZE,
    borderRadius: QR_PAYMENT_AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
  },
  qrPaymentAvatarImage: {
    width: '100%',
    height: '100%',
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
  redeemHint: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: spacing.sm,
    lineHeight: 18,
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