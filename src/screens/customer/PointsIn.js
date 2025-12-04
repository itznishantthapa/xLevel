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
import { useQueryClient } from "@tanstack/react-query"
import AppHeader from "./header/AppHeader"
import { usePointsIn } from "../../queries/useMutation/usePointsIn"
import CoolButton from "../../component/customer/common/CoolButton"
import { useBanners } from "../../queries/useBanners"
import { useUtils } from "../../queries/useUtils"
import { scaleWidth, scaleHeight } from "../../utils/scaling"


const PointsIn = () => {
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
  const { mutateAsync: pointsIn } = usePointsIn();
  const {data: utils = []} = useUtils();

  // Get QR image from utils
  const qrImageUrl = utils?.qr?.qr_image;

 
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#e0e0e0" : "#333333",
    inputBorder: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#f8f9fa" : "#1a1a1a",
    qrBg: isLight ? "#ffffff" : "#0a0a0a",
    cardBg: isLight ? "#f8f9fa" : "#0f0f0f",
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
      await pointsIn(formData);


      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'gamePoints' }
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
          title={'Add Points'}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* U-Shaped Pocket Design */}
          <View style={[styles.pocketContainer, {
            backgroundColor: colors.cardBg,
            borderColor: isLight ? colors.border : colors.inputBorder
          }]}>
            
            {/* Instructions at the center of the pocket */}
            <View style={styles.instructionsSection}>
              <Text style={[styles.instructionsTitle, { color: colors.text }]}>Important Instructions</Text>
              
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionRow}>
                  <View style={[styles.stepBadge, { backgroundColor: isLight ? "#000000" : "#ffffff" }]}>
                    <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#000000" }]}>1</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    Payment must be between Rs. 10 and Rs. 10,000  {"\n"} (Rs. 1 = 1 Point)
                  </Text>
                </View>

                <View style={styles.instructionRow}>
                  <View style={[styles.stepBadge, { backgroundColor: isLight ? "#000000" : "#ffffff" }]}>
                    <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#000000" }]}>2</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    Write your app's email in the payment remarks (Important).
                  </Text>
                </View>

                <View style={styles.instructionRow}>
                  <View style={[styles.stepBadge, { backgroundColor: isLight ? "#000000" : "#ffffff" }]}>
                    <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#000000" }]}>3</Text>
                  </View>
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    Upload payment screenshot below
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* QR Code positioned at the bottom border of the pocket */}
          <View style={styles.qrSection}>
            <View style={[styles.qrContainer, {
              backgroundColor: colors.qrBg,
              borderColor: isLight ? colors.border : colors.inputBorder
            }]}>
              {qrImageUrl ? (
                <Image 
                  source={{ uri: qrImageUrl }} 
                  style={styles.qrLogo} 
                  resizeMode="contain" 
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={scaleWidth(120)} color={colors.textSecondary} />
                  <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                    Loading QR Code...
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Crown Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Points Amount</Text>
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
                  <Ionicons name="alert-circle" size={scaleWidth(14)} color="#FF4444" />
                  <Text style={styles.errorText}>{errors.amount}</Text>
                </View>
              ) : null}
            </View>

            {/* Upload Screenshot Section */}
            <View style={styles.uploadContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Screenshot</Text>
              <Pressable
                style={[
                  styles.uploadButton,
                  screenshot && styles.uploadButtonWithImage,
                  {
                    borderColor: errors.screenshot ? '#FF4444' : isLight ? "#000000" : "#ffffff",
                    backgroundColor: colors.inputBg,
                  }
                ]}
                onPress={pickImage}
              >
                {screenshot ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: screenshot }} style={styles.selectedImage} />
                    <View style={styles.imageTextContainer}>
                      <Text style={[styles.imageFileName, { color: colors.text }]}>Screenshot uploaded</Text>
                      <Text style={[styles.changeImageText, { color: colors.textSecondary }]}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadButtonContent}>
                    <Ionicons name="cloud-upload-outline" size={scaleWidth(32)} color={colors.textSecondary} />
                    <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>Tap to upload screenshot</Text>
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

        </ScrollView>

        <View style={styles.footer}>
          <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Add Points'} />
        </View>

      </View>
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
    paddingBottom: scaleHeight(10),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleHeight(40),
  },
  pocketContainer: {
    marginHorizontal: scaleWidth(10),
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(0), // Reduced to allow QR to sit at the border
    borderRadius: scaleWidth(0),
    borderWidth: scaleWidth(2),
    paddingTop: scaleHeight(30),
    paddingBottom: scaleHeight(150), // Significantly increased bottom padding for more space
    paddingHorizontal: scaleWidth(20),
    minHeight: scaleHeight(280), // Added minimum height to make it longer
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scaleHeight(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: scaleWidth(12),
    elevation: 8,
    // U-shaped design with much more curved bottom
    // borderBottomLeftRadius: scaleWidth(100),  
    // borderBottomRightRadius: scaleWidth(100), 
    position: 'relative',
  },
  instructionsSection: {
    paddingHorizontal: scaleWidth(10),
    paddingBottom: scaleHeight(0), // Removed bottom padding since QR is outside now
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: scaleWidth(22),
    fontWeight: '600',
    marginBottom: scaleHeight(18),
    textAlign: 'center',
  },
  instructionsContainer: {
    gap: scaleHeight(12),
    width: '100%',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(12),
  },
  stepBadge: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(11),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: scaleHeight(1),
  },
  stepNumber: {
    fontSize: scaleWidth(11),
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: scaleWidth(13),
    fontWeight: '400',
    lineHeight: scaleHeight(19),
  },
  qrSection: {
    alignItems: 'center',
    // Position QR overlapping the bottom border of the pocket
    marginTop: scaleHeight(-120), // Negative margin to position at border
    marginBottom: scaleHeight(20),
    elevation: 15, // Higher elevation for Android instead of zIndex
    zIndex: 15, // Keep zIndex for iOS
  },
  qrContainer: {
    width: scaleWidth(280),
    height: scaleWidth(260),
    borderRadius: scaleWidth(0),
    borderWidth: scaleWidth(1),
    padding: scaleWidth(10),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scaleHeight(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: scaleWidth(8),
    elevation: 12, // Higher elevation than parent container
  },
  qrLogo: {
    height: "100%",
    width: "100%",
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleHeight(12),
  },
  qrPlaceholderText: {
    fontSize: scaleWidth(14),
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: scaleWidth(20),
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scaleWidth(1.5),
    borderRadius: scaleWidth(25),
    paddingHorizontal: scaleWidth(8),
    gap: scaleWidth(12),
  },
  pointsIconContainer: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: scaleWidth(10),
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
    borderWidth: scaleWidth(1.5),
    borderRadius: scaleWidth(25),
    paddingVertical: scaleHeight(20),
    paddingHorizontal: scaleWidth(16),
  },
  uploadButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
  imageFileName: {
    fontSize: scaleWidth(15),
    fontWeight: "600",
    marginBottom: scaleHeight(4),
  },
  changeImageText: {
    fontSize: scaleWidth(13),
    fontWeight: "400",
  },
  uploadButtonWithImage: {
    justifyContent: "flex-start",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    marginTop: scaleHeight(6),
  },
  errorText: {
    fontSize: scaleWidth(12),
    fontWeight: '500',
    color: '#FF4444',
  }
})