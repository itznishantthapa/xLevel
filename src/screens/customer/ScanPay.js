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
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useState } from "react"
import Toast from "react-native-simple-toast"
import * as ImagePicker from "expo-image-picker"
import { TranscationAPI } from "../../api/transcationApi"
import { useQueryClient } from "@tanstack/react-query"
import AppHeader from "./header/AppHeader"
import { useCredit } from "../../queries/useMutation/useCredit"
import CoolButton from "../../component/customer/common/CoolButton"
import { useBanners } from "../../queries/useBanners"
import { useUtils } from "../../queries/useUtils"


const ScanPay = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [disableBtn, setdisableBtn] = useState(false)
  const { isLight } = useThemeStore()
  const [crownAmount, setCrownAmount] = useState("")
  const [imageResult, setImageResult] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [errors, setErrors] = useState({
    amount: '',
    screenshot: ''
  })
  const { mutateAsync: creditCrown } = useCredit();
  const {data: utils = []} = useUtils();

  // Get QR image from utils
  const qrImageUrl = utils?.qr?.qr_image;

 
  const colors = {
    background: isLight ? "#eef0f2" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#ffffff" : "#1a1a1a",
    qrBg: isLight ? "#f8f9fa" : "#1a1a1a",
  }

  // Image picker function
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
    };

    if (!crownAmount) {
      newErrors.amount = 'Please enter amount';
    }

    if (!screenshot) {
      newErrors.screenshot = 'Please upload payment screenshot';
    }

    setErrors(newErrors);
    return !newErrors.amount && !newErrors.screenshot;
  };

  const handleSubmit = async () => {

    if (!validateFields()) {
      return;
    }
    setdisableBtn(true)

    // Prepare form data
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
      await creditCrown(formData);


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
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <View style={[styles.container, {
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }]}>

        <AppHeader
          backButton={true}
          title={'Scan & Pay'}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Pocket Design with Instructions */}
          <View style={styles.pocketWrapper}>
            <View style={[styles.pocketContainer, {
              backgroundColor: isLight ? '#00C851' : '#1a1a1a',
              borderColor: '#00C851'
            }]}>
              {/* Pocket Content - Instructions */}
              <View style={styles.pocketContent}>
                <View style={styles.instructionHeader}>
                  <MaterialCommunityIcons name="information" size={20} color={isLight ? "#ffffff" : "#00C851"} />
                  <Text style={[styles.instructionTitle, { color: isLight ? "#ffffff" : "#00C851" }]}>
                    Payment Instructions
                  </Text>
                </View>

                <View style={styles.instructionsContainer}>
                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(0,200,81,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#00C851" }]}>1</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Payment must be between Rs. 10 and Rs. 10,000 (Rs. 1 = 1 Point).
                    </Text>
                  </View>

                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(0,200,81,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#00C851" }]}>2</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Write your app's email in the payment remarks (Important).
                    </Text>
                  </View>

                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(0,200,81,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#00C851" }]}>3</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Upload payment screenshot below
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* QR Code overlapping the pocket bottom */}
            <View style={styles.qrOverlapContainer}>
              <View style={[styles.qrContainer, {
                backgroundColor: colors.qrBg,
                borderColor: colors.border
              }]}>
                {qrImageUrl ? (
                  <Image 
                    source={{ uri: qrImageUrl }} 
                    style={styles.qrLogo} 
                    resizeMode="contain" 
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={80} color={colors.textSecondary} />
                    <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                      Loading QR Code...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Crown Amount Input */}
            <View style={styles.inputContainer}>
              <View style={styles.labelCrownContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Points Amount</Text>
              </View>
              <View style={[styles.inputWrapper, {
                borderColor: errors.amount ? '#FF4444' : colors.border,
                backgroundColor: colors.inputBg,
              }]}>

                <MaterialCommunityIcons
                  name="star-four-points-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
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
                  <Ionicons name="alert-circle" size={14} color="#FF4444" />
                  <Text style={styles.errorText}>{errors.amount}</Text>
                </View>
              ) : null}
            </View>

            {/* Upload Screenshot Section */}
            <View style={styles.uploadContainer}>
              <View style={styles.labelCrownContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Screenshot</Text>
              </View>
              <Pressable
                style={[
                  styles.uploadButton,
                  screenshot && styles.uploadButtonWithImage,
                  errors.screenshot && styles.uploadButtonError,
                  { borderColor: errors.screenshot ? '#FF4444' : '#00C851' }
                ]}
                onPress={pickImage}
              >
                {screenshot ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: screenshot }} style={styles.selectedImage} />
                    <View style={styles.imageTextContainer}>
                      <Text style={[styles.imageFileName, { color: colors.text }]}>Screenshot uploaded</Text>
                      <Text style={styles.changeImageText}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadButtonContent}>
                    <View style={styles.uploadIconContainer}>
                      <Ionicons name="cloud-upload-outline" size={32} color="#00C851" />
                    </View>
                    <Text style={styles.uploadButtonText}>Tap to upload screenshot</Text>
                  </View>
                )}
              </Pressable>
              {errors.screenshot ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#FF4444" />
                  <Text style={styles.errorText}>{errors.screenshot}</Text>
                </View>
              ) : null}
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Submit'} />
        </View>

      </View>
    </>
  )
}

export default ScanPay

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingTop: 20,
    paddingBottom: 40,
  },
  pocketWrapper: {
    width: "100%",
    // marginBottom: 60,
    position: 'relative',
  },
  pocketContainer: {
    width: "100%",
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    borderWidth: 2,
    paddingTop: 20,
    paddingBottom: 80,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  pocketContent: {
    width: "100%",
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    gap: 12,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingTop: 4,
  },
  qrOverlapContainer: {
    position: 'absolute',
    bottom: -220,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  qrContainer: {
    width: '90%',
    height: 340,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  qrLogo: {
    height: "100%",
    width: "100%",
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 20,
    marginTop: 230,
    paddingHorizontal: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  uploadContainer: {
    marginBottom: 20,
  },
  labelCrownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#00C851",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 200, 81, 0.05)",
  },
  uploadButtonError: {
    backgroundColor: "rgba(255, 68, 68, 0.05)",
  },
  uploadButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#00C851",
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    fontWeight: "400",
  },
  selectedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    gap: 12,
  },
  selectedImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  imageTextContainer: {
    flex: 1,
  },
  imageFileName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  changeImageText: {
    fontSize: 13,
    color: "#00C851",
    fontWeight: "500",
  },
  uploadButtonWithImage: {
    backgroundColor: "rgba(0, 200, 81, 0.08)",
    borderStyle: "solid",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4444',
  }
})