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
import { FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useState } from "react"
import Toast from "react-native-simple-toast"
import * as ImagePicker from "expo-image-picker"
import AppHeader from "./header/AppHeader"
import { usePointsIn } from "../../queries/useMutation/usePointsIn"
import CoolButton from "../../component/customer/common/CoolButton"
import { useUtils } from "../../queries/useUtils"
import { scaleWidth, scaleHeight } from "../../utils/scaling"

const PAYMENT_AVATARS = [
  require("../../assets/esewa.png"),
  require("../../assets/khalti.png"),
  require("../../assets/bank.png"),
]

const PAYMENT_AVATAR_SIZE = scaleWidth(32)
const PAYMENT_AVATAR_OVERLAP = scaleWidth(-10)

const PointsIn = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [disableBtn, setdisableBtn] = useState(false)
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
                        <Ionicons name="qr-code-outline" size={scaleWidth(100)} color={colors.textSecondary} />
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
                        <MaterialCommunityIcons
                          name="star-four-points-outline"
                          size={scaleWidth(16)}
                          color={isLight ? "#ffffff" : "#20c997"}
                        />
                      </View>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Point Amount"
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
                        <Ionicons name="alert-circle" size={scaleWidth(14)} color="#FF4444" />
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
                              <FontAwesome name="check-circle" size={scaleWidth(20)} color="#00bf63" />
                            </View>
                            <Text style={[styles.changeImageText, { color: colors.textSecondary }]}>Tap to change</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadButtonContent}>
                          <Ionicons name="cloud-upload-outline" size={scaleWidth(32)} color={colors.textSecondary} />
                          <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                            Payment Screenshot
                          </Text>
                        </View>
                      )}
                    </Pressable>
                    {errors.screenshot ? (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={scaleWidth(14)} color="#FF4444" />
                        <Text style={styles.errorText}>{errors.screenshot}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, Platform.OS === "android" && { marginBottom: scaleHeight(10) }]}>
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
    paddingHorizontal: scaleWidth(20),
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: scaleHeight(24),
  },
  contentColumn: {
    width: "90%",
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(24),
  },
  heroTitle: {
    fontSize: scaleWidth(20),
    fontWeight: "700",
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: scaleHeight(6),
    fontSize: scaleWidth(14),
    fontWeight: "400",
    textAlign: "center",
  },
  qrCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: scaleWidth(10),
    paddingTop: scaleHeight(24),
    paddingBottom: scaleHeight(20),
    paddingHorizontal: scaleWidth(20),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleHeight(28),
  },
  qrCardShadowLight: {
    borderWidth: scaleWidth(2),
    borderColor: "#666666",
  },
  qrCardShadowDark: {
    borderWidth: scaleWidth(2),
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
    gap: scaleHeight(10),
  },
  qrPlaceholderText: {
    fontSize: scaleWidth(13),
    fontWeight: "500",
  },
  brandSection: {
    alignItems: "center",
    marginTop: scaleHeight(14),
    gap: scaleHeight(10),
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleWidth(6),
  },
  brandName: {
    fontSize: scaleWidth(20),
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  brandWith: {
    fontSize: scaleWidth(14),
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
    marginBottom: scaleHeight(20),
  },
  uploadContainer: {
    marginBottom: scaleHeight(20),
  },
  inputLabel: {
    fontSize: scaleWidth(15),
    fontWeight: "600",
    marginBottom: scaleHeight(10),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: scaleWidth(2),
    borderRadius: scaleWidth(25),
    paddingHorizontal: scaleWidth(8),
    gap: scaleWidth(12),
  },
  pointsIconContainer: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    fontSize: scaleWidth(16),
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scaleWidth(2),
    borderRadius: scaleWidth(15),
    // borderTopRightRadius: scaleWidth(0),
    // borderTopLeftRadius: scaleWidth(0),
    // borderBottomLeftRadius: scaleWidth(10),
    // borderBottomRightRadius: scaleWidth(10),


    paddingVertical: scaleHeight(20),
    paddingHorizontal: scaleWidth(16),
  },
  uploadButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: scaleHeight(8),
  },
  uploadButtonText: {
    fontSize: scaleWidth(15),
    fontWeight: "500",
  },
  selectedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    gap: scaleWidth(12),
  },
  selectedImage: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(8),
  },
  imageTextContainer: {
    flex: 1,
  },
  screenshotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleWidth(8),
    marginBottom: scaleHeight(4),
  },

  imageFileName: {
    fontSize: scaleWidth(15),
    fontWeight: "600",
  },
  changeImageText: {
    fontSize: scaleWidth(13),
    fontWeight: "400",
  },
  uploadButtonWithImage: {
    justifyContent: "flex-start",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleWidth(4),
    marginTop: scaleHeight(4),
  },
  errorText: {
    fontSize: scaleWidth(12),
    fontWeight: "500",
    color: "#FF4444",
  },
})
