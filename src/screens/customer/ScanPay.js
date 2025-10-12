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
  Keyboard,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useState, useRef, useEffect } from "react"
import Toast from "react-native-simple-toast"
import * as ImagePicker from "expo-image-picker"
import { TranscationAPI } from "../../api/transcationApi"
import { useQueryClient } from "@tanstack/react-query"
import AppHeader from "./header/AppHeader"
import { useCredit } from "../../queries/useMutation/useCredit"
import CoolButton from "../../component/customer/common/CoolButton"


const ScanPay = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [disableBtn, setdisableBtn] = useState(false)
  const { isLight } = useThemeStore()
  const [crownAmount, setCrownAmount] = useState("")
  const [imageResult, setImageResult] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const scrollViewRef = useRef(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [errors, setErrors] = useState({
    amount: '',
    screenshot: ''
  })
  const { mutateAsync: creditCrown } = useCredit();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#ffffff" : "#1a1a1a",
    qrBg: isLight ? "#f8f9fa" : "#1a1a1a",
  }

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true)
        scrollViewRef.current?.scrollTo({
          y: Platform.OS === "ios" ? 300 : 500,
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
  }, [])

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
      newErrors.amount = 'Please enter crown amount';
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.container, {
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }]}>
        {/* Full-width header with wallet-style curve */}
        <View style={styles.headerContainer}>
          {/* Main header content */}
          <View style={[styles.headerContent, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : insets.top }]}>
            {
              Platform.OS === 'ios' && (
                <Pressable style={{ alignSelf: 'flex-start', marginLeft: 10 }} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-back" size={25} color={'white'} />
                </Pressable>
              )
            }



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
                  source={require("../../assets/xKick.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.tagline}>Level Up Your Gaming Wallet</Text>
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

          {/* QR Code Section */}
          <View style={[styles.qrContainer, { backgroundColor: colors.qrBg }]}>
            <Image source={require("../../assets/nishant-qr.png")} style={styles.qrLogo} resizeMode="contain" />
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.labelCrownContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Crown Amount</Text>
                <MaterialCommunityIcons name="crown" size={20} color="#00C851" style={{ marginBottom: 4 }} />
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

            <Pressable
              style={[styles.uploadButton, screenshot && styles.uploadButtonWithImage]}
              onPress={pickImage}
            >
              {screenshot ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: screenshot }} style={styles.selectedImage} />
                  <Text style={styles.changeImageText}>Change Screenshot</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color="#00C851" />
                  <Text style={styles.uploadButtonText}>Upload Screenshot</Text>
                </>
              )}
            </Pressable>
            {errors.screenshot ? (
              <Text style={[styles.errorText, { color: '#FF4444', textAlign: 'start', marginTop: 8 }]}>
                {errors.screenshot}
              </Text>
            ) : null}
          </View>

        </ScrollView>
        {/* <View style={styles.footer}>
          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: isLight ? '#000000' : '#ffffff' }
            ]}
            onPress={handleSubmit}
            disabled={disableBtn} 
          >
            <Text style={[
              styles.submitButtonText,
              { color: isLight ? '#ffffff' : '#000000' }
            ]}>{disableBtn ? 'Submitting...' : 'Submit'}</Text>
          </Pressable>
        </View> */}

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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  qrContainer: {
    width: "100%",
    height: 350,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  qrLogo: {
    height: "100%",
    width: "100%",
  },
  formContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  labelCrownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00C851",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 200, 81, 0.1)",
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#00C851",
    fontWeight: "500",
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  selectedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  changeImageText: {
    fontSize: 16,
    color: "#00C851",
    fontWeight: "500",
  },
  uploadButtonWithImage: {
    backgroundColor: "rgba(0, 200, 81, 0.05)",
  },
  errorText: {

    fontSize: 12,
    fontWeight: '500',

  }
})