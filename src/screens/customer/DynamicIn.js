import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useState, useMemo } from "react"
import AppHeader from "./header/AppHeader"
import CoolButton from "../../component/customer/common/CoolButton"
import { scaleWidth, scaleHeight } from "../../utils/scaling"
import QRCode from "react-native-qrcode-svg"
import Toast from "react-native-simple-toast"
import { GamePointAPI } from "../../api/pointsApi"
import { useAuthStore } from "../../store/authStore"
import { useUtils } from "../../queries/useUtils"

const DynamicIn = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isLight } = useThemeStore()
  const { get_user } = useAuthStore()
  const { data: utils = {} } = useUtils()
  const [crownAmount, setCrownAmount] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [qrValue, setQrValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    inputBorder: isLight ? "#000000" : "#ffffff",
  }

  // Generate random star positions for background confetti
  const backgroundStars = useMemo(() => {
    const stars = []
    const numberOfStars = 25 // Increased density
    for (let i = 0; i < numberOfStars; i++) {
      stars.push({
        id: i,
        top: Math.random() * 100, // percentage
        left: Math.random() * 100, // percentage
        size: scaleWidth(14 + Math.random() * 10), // varied sizes (14-24px)
        opacity: 0.3 + Math.random() * 0.2, // more visible opacity 0.3-0.5
        rotation: Math.random() * 360, // random rotation
      })
    }
    return stars
  }, [])

  const handleProceed = async () => {
    if (!crownAmount || crownAmount.trim() === '') {
      Toast.show('Please enter points amount', Toast.SHORT)
      return
    }
    
    const amount = parseInt(crownAmount)
    if (isNaN(amount)) {
      Toast.show('Please enter a valid number', Toast.SHORT)
      return
    }
    
    if (amount < 10) {
      Toast.show('Minimum amount is 10 points', Toast.SHORT)
      return
    }
    
    if (amount > 10000) {
      Toast.show('Maximum amount is 10,000 points', Toast.SHORT)
      return
    }
    
    Keyboard.dismiss()
    setLoading(true)
    
    try {
      // Call backend API to create dynamic transaction
      const response = await GamePointAPI.createDynamicTransaction(amount)
      
      if (response.success) {
        setTransactionId(response.transaction_id)
        setQrValue(response.qr_data_url)
        setShowQR(true)
      } else {
        Toast.show(response.message || 'Proceed Failed', Toast.SHORT)
      }
    } catch (error) {
      const errorMessage = error?.message
      Toast.show(errorMessage, Toast.LONG)
    } finally {
      setLoading(false)
    }
  }

  const handleDone = async () => {
    setLoading(true)
    try {
      // Refresh user data to get updated wallet balance
      await get_user()
      
      // Navigate back to previous screen
      navigation.goBack()
    } catch (error) {
      // Even if refresh fails, navigate back
      if (__DEV__) {
        console.error('Failed to refresh user data:', error)
      }
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <KeyboardAvoidingView
        style={[styles.container, {
          backgroundColor: colors.background,
        }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.innerContainer, {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }]}>
            {/* Background Confetti Stars */}
            <View style={styles.backgroundStarsContainer}>
          {backgroundStars.map((star) => (
            <View
              key={star.id}
              style={[
                styles.backgroundStar,
                {
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  opacity: star.opacity,
                  transform: [{ rotate: `${star.rotation}deg` }],
                },
              ]}
            >
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={star.size}
                color="#00bf63"
              />
            </View>
          ))}
        </View>

            <AppHeader
              backButton={true}
              title={'Add Points'}
            />

            <View style={styles.content}>
          {/* Card with Cyberpunk Geometry */}
          <View style={[styles.pointCard, {
            backgroundColor: isLight ? '#ffffff' : '#0f0f0f',
            borderColor: colors.text,
          }]}>
            {/* Decorative top corners */}
            <View style={[styles.cornerDecoration, styles.cornerTopLeft, {
              borderColor: colors.text,
            }]} />
            <View style={[styles.cornerDecoration, styles.cornerTopRight, {
              borderColor: colors.text,
            }]} />
            {/* Angular cuts */}
            <View style={[styles.angularCut, styles.cutTopRight, {
              borderColor: colors.text,
            }]} />
            <View style={[styles.angularCut, styles.cutBottomLeft, {
              borderColor: colors.text,
            }]} />

            {/* Header Section */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {showQR ? 'Scan & Pay' : 'Add Points to Your Account'}
              </Text>
              {showQR ? (
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  This QR code contains your points amount and app email.{'\n'}Scan with eSewa or Khalti to complete payment.
                </Text>
              ) : (
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {utils?.is_ios_active
                    ? "Enter the points. After entering, we'll generate a dynamic QR for your transaction. Points will be added to your account instantly and can be used for gaming and purchasing in the app."
                    : "Enter the points. After entering, we'll generate a dynamic QR for your transaction. Points will be added to your account instantly and can be used for purchasing gaming gadgets from the product section."}
                </Text>
              )}
            </View>

            {showQR ? (
              /* QR Code Display */
              <View style={styles.qrContainer}>
                <View style={[styles.qrWrapper, {
                  backgroundColor: '#ffffff',
                  borderColor: colors.text,
                }]}>
                  <QRCode
                    value={qrValue}
                    size={scaleWidth(200)}
                    color="#000000"
                    backgroundColor="#ffffff"
                  />
                </View>
              </View>
            ) : (
              /* Amount Input */
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Points Amount</Text>
                <View style={[styles.inputWrapper, {
                  borderColor: colors.inputBorder,
                  backgroundColor: 'transparent',
                }]}>
                  <View style={[
                    styles.pointsIconContainer,
                    { 
                      backgroundColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)',
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
                    onChangeText={setCrownAmount}
                  />
                </View>
              </View>
            )}

            {/* Bottom decorative corners */}
            <View style={[styles.cornerDecoration, styles.cornerBottomLeft, {
              borderColor: colors.text,
            }]} />
            <View style={[styles.cornerDecoration, styles.cornerBottomRight, {
              borderColor: colors.text,
            }]} />
          </View>
            </View>

            <View style={[styles.footer,Platform.OS === "android" && { marginBottom: scaleHeight(10) }]}>
              <CoolButton 
                handlePress={showQR ? handleDone : handleProceed} 
                disableBtn={loading} 
                title={showQR ? 'Done' : 'Proceed'} 
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  )
}

export default DynamicIn

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  innerContainer: {
    flex: 1,
    width: "100%",
  },
  backgroundStarsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundStar: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
    justifyContent: 'center',
    zIndex: 1,
  },
  pointCard: {
    borderRadius: scaleWidth(4),
    borderWidth: scaleWidth(2),
    padding: scaleWidth(24),
    position: 'relative',
    overflow: 'hidden',
  },
  cornerDecoration: {
    position: 'absolute',
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderWidth: scaleWidth(2),
  },
  cornerTopLeft: {
    top: scaleWidth(-2),
    left: scaleWidth(-2),
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: scaleWidth(-2),
    right: scaleWidth(-2),
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: scaleWidth(-2),
    left: scaleWidth(-2),
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: scaleWidth(-2),
    right: scaleWidth(-2),
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  angularCut: {
    position: 'absolute',
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderWidth: scaleWidth(1),
    transform: [{ rotate: '45deg' }],
  },
  cutTopRight: {
    top: scaleWidth(20),
    right: scaleWidth(-15),
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cutBottomLeft: {
    bottom: scaleWidth(20),
    left: scaleWidth(-15),
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: scaleHeight(20),
  },
  cardTitle: {
    fontSize: scaleWidth(20),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scaleHeight(6),
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: scaleWidth(13),
    fontWeight: '400',
    textAlign: 'center',
  },
  inputContainer: {
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
  input: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    fontSize: scaleWidth(16),
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(20),
  },
  qrWrapper: {
    padding: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: scaleWidth(2),
  },
  qrInstruction: {
    fontSize: scaleWidth(12),
    textAlign: 'center',
    marginBottom: scaleHeight(16),
  },
  footer: {
    paddingHorizontal: scaleWidth(20),
    // paddingBottom: scaleHeight(10),
    marginTop: 'auto',
    zIndex: 1,
  },
})
