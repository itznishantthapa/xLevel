import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useThemeStore } from "../../store/themeStore"
import { useState, useCallback } from "react"
import Toast from "react-native-simple-toast"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import AppHeader from "./header/AppHeader"
import { usePointsIn } from "../../queries/useMutation/usePointsIn"
import CoolButton from "../../component/customer/common/CoolButton"
import { useUtils } from "../../queries/useUtils"
import { AppIcon, PointsIcon } from "../../components/common/AppIcon"
import {
  QrCodeIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  CloudUploadIcon,
  DownloadCircle01Icon,
} from "@hugeicons/core-free-icons"
import { fontSize, spacing, radius, iconSize } from "../../theme/typography"

const PAYMENT_AVATARS = [
  require("../../assets/esewa.png"),
  require("../../assets/khalti.png"),
  require("../../assets/bank.png"),
]

const PAYMENT_AVATAR_SIZE = spacing['3xl']
const PAYMENT_AVATAR_OVERLAP = -10

const PointsIn = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [disableBtn, setdisableBtn] = useState(false)
  const [isDownloadingQr, setIsDownloadingQr] = useState(false)
  const { isLight } = useThemeStore()
  const [crownAmount, setCrownAmount] = useState("")
  const [imageResult, setImageResult] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [errors, setErrors] = useState({
    amount: '',
    screenshot: ''
  })
  const { mutateAsync: pointsIn } = usePointsIn()
  const { data: utils = [] } = useUtils()

  const qrImageUrl = utils?.qr?.qr_image

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#e0e0e0" : "#333333",
    inputBorder: isLight ? "#666666" : "#ffffff",
    inputBg: isLight ? "#ffffff" : "#111111",
    cardBg: isLight ? "#ffffff" : "#111111",
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 1,
      })

      if (!result.canceled) {
        setImageResult(result.assets[0])
        setScreenshot(result.assets[0].uri)
        if (errors.screenshot) {
          setErrors(prev => ({ ...prev, screenshot: '' }))
        }
      }
    } catch (error) {
      Toast.show("Unable to pick image", Toast.SHORT)
    }
  }

  const handleDownloadQr = useCallback(async () => {
    if (!qrImageUrl || isDownloadingQr) {
      return
    }

    try {
      setIsDownloadingQr(true)

      const fileExtension = qrImageUrl.split('.').pop()?.split('?')[0] || 'jpg'
      const fileUri = `${FileSystem.cacheDirectory}payment-qr.${fileExtension}`
      const downloadResult = await FileSystem.downloadAsync(qrImageUrl, fileUri)

      await MediaLibrary.saveToLibraryAsync(downloadResult.uri)
      Toast.show('QR code saved to gallery.', Toast.SHORT)
    } catch (error) {
      Toast.show('Unable to download QR code.', Toast.SHORT)
    } finally {
      setIsDownloadingQr(false)
    }
  }, [qrImageUrl, isDownloadingQr])

  const validateFields = () => {
    const newErrors = {
      amount: '',
      screenshot: ''
    }

    if (!crownAmount) {
      newErrors.amount = 'Please enter amount'
    }

    if (!screenshot) {
      newErrors.screenshot = 'Please upload screenshot'
    }

    setErrors(newErrors)
    return !newErrors.amount && !newErrors.screenshot
  }

  const handleSubmit = async () => {
    Keyboard.dismiss()

    if (!validateFields()) {
      return
    }
    setdisableBtn(true)

    const formData = new FormData()
    formData.append('crown_amount', crownAmount)
    if (imageResult) {
      formData.append('screenshot', {
        uri: screenshot,
        name: 'screenshot.jpg',
        type: imageResult.mimeType || 'image/jpeg'
      })
    }

    try {
      await pointsIn(formData)

      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'gamePoints' }
        ],
      })
    } catch (err) {
      Toast.show(err?.message || 'Failed to submit credit request.', Toast.SHORT)
    } finally {
      setTimeout(() => {
        setdisableBtn(false)
      }, 2000)
    }
  }

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
              title={'Add Points'}
            />

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.heroSection}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  Scan & Pay for Game Points
                </Text>
             
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    1 Rupees = 1 Point
                  </Text>
               
              </View>

              <View style={styles.contentColumn}>
                <View style={[
                  styles.qrCard,
                  {
                    backgroundColor: colors.cardBg,
                    ...(isLight ? styles.qrCardShadowLight : styles.qrCardShadowDark),
                  },
                ]}>
                  <View style={styles.qrImageWrapper}>
                    {qrImageUrl ? (
                      <Image
                        source={{ uri: qrImageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <AppIcon icon={QrCodeIcon} size={100} color={colors.textSecondary} />
                        <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                          Loading QR Code...
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.brandSection}>
                    <View style={styles.brandTitleRow}>
                      <Text style={[styles.brandName, { color: colors.text }]}>ScanPay</Text>
                      <Text style={[styles.brandWith, { color: colors.textSecondary }]}>with</Text>
                    </View>
                    <View style={styles.paymentAvatarRow}>
                      {PAYMENT_AVATARS.map((source, index) => (
                        <View
                          key={index}
                          style={[
                            styles.paymentAvatar,
                            {
                              marginLeft: index === 0 ? 0 : PAYMENT_AVATAR_OVERLAP,
                              zIndex: PAYMENT_AVATARS.length - index,
                            },
                          ]}
                        >
                          <Image source={source} style={styles.paymentAvatarImage} resizeMode="cover" />
                        </View>
                      ))}
                    </View>
                  </View>

                  {qrImageUrl ? (
                    <Pressable
                      style={[
                        styles.qrDownloadButton,
                        { opacity: isDownloadingQr ? 0.6 : 1 },
                      ]}
                      onPress={handleDownloadQr}
                      disabled={isDownloadingQr}
                      accessibilityRole="button"
                      accessibilityLabel="Download QR code"
                    >
                      <AppIcon
                        icon={DownloadCircle01Icon}
                        size={iconSize.xl + 4}
                        color={colors.text}
                      />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    {/* <Text style={[styles.inputLabel, { color: colors.text }]}>Points Amount</Text> */}
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
                        placeholder="Point Amount ( min. 10 points )"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={crownAmount}
                        onChangeText={(text) => {
                          setCrownAmount(text)
                          if (errors.amount) {
                            setErrors(prev => ({ ...prev, amount: '' }))
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

                  <View style={styles.uploadContainer}>
                    {/* <Text style={[styles.inputLabel, { color: colors.text }]}>Upload Screenshot</Text> */}
                    <Pressable
                      style={[
                        styles.uploadButton,
                        screenshot && styles.uploadButtonWithImage,
                        {
                          borderColor: errors.screenshot ? '#FF4444' : colors.inputBorder,
                          backgroundColor: colors.inputBg,
                        },
                      ]}
                      onPress={pickImage}
                    >
                      {screenshot ? (
                        <View style={styles.selectedImageContainer}>
                          <Image source={{ uri: screenshot }} style={styles.selectedImage} />
                          <View style={styles.imageTextContainer}>
                            <View style={styles.screenshotTitleRow}>
                              <Text style={[styles.imageFileName, { color: colors.text }]}>
                                Screenshot selected
                              </Text>
                              <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.md} color="#00bf63" />
                            </View>
                            <Text style={[styles.changeImageText, { color: colors.textSecondary }]}>Tap to change</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadButtonContent}>
                          <AppIcon icon={CloudUploadIcon} size={iconSize.xl + 4} color={colors.textSecondary} />
                          <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                            Payment Screenshot
                          </Text>
                        </View>
                      )}
                    </Pressable>
                    {errors.screenshot ? (
                      <View style={styles.errorContainer}>
                        <AppIcon icon={AlertCircleIcon} size={iconSize.xs} color="#FF4444" />
                        <Text style={styles.errorText}>{errors.screenshot}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, Platform.OS === "android" && { marginBottom: spacing.sm }]}>
              <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Add Points'} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  )
}

export default PointsIn

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
    alignItems: "center",
    paddingBottom: spacing['2xl'],
  },
  contentColumn: {
    width: "90%",
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: spacing.xs + 2,
    fontSize: fontSize.base,
    fontWeight: "400",
    textAlign: "center",
  },
  qrCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: spacing.sm + 2,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing['2xl'] + 4,
    position: "relative",
  },
  qrCardShadowLight: {
    borderWidth: 2,
    borderColor: "#666666",
  },
  qrCardShadowDark: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  qrImageWrapper: {
    width: "78%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
  },
  qrPlaceholderText: {
    fontSize: fontSize.sm + 1,
    fontWeight: "500",
  },
  qrDownloadButton: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    zIndex: 1,
  },
  brandSection: {
    alignItems: "center",
    marginTop: fontSize.base,
    gap: spacing.sm + 2,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  brandName: {
    fontSize: fontSize.xl,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  brandWith: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  paymentAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAvatar: {
    width: PAYMENT_AVATAR_SIZE,
    height: PAYMENT_AVATAR_SIZE,
    borderRadius: PAYMENT_AVATAR_SIZE / 2,
    overflow: "hidden",
  },
  paymentAvatarImage: {
    width: "100%",
    height: "100%",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  uploadContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSize.base + 1,
    fontWeight: "600",
    marginBottom: spacing.sm + 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.pill - 7,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  pointsIconContainer: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
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
    borderWidth: 2,
    borderRadius: radius.lg + 3,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  uploadButtonContent: {
    alignItems: "center",
    justifyContent: "center",
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
  screenshotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },

  imageFileName: {
    fontSize: fontSize.base + 1,
    fontWeight: "600",
  },
  changeImageText: {
    fontSize: fontSize.sm + 1,
    fontWeight: "400",
  },
  uploadButtonWithImage: {
    justifyContent: "flex-start",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: "#FF4444",
  },
})
