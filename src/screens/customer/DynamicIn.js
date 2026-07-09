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
import { useThemeStore } from "../../store/themeStore"
import { useState, useMemo } from "react"
import AppHeader from "./header/AppHeader"
import CoolButton from "../../component/customer/common/CoolButton"
import { fontSize, spacing, radius, iconSize } from "../../theme/typography"
import { PointsIcon } from "../../components/common/AppIcon"
import QRCode from "react-native-qrcode-svg"
import Toast from "react-native-simple-toast"
import { GamePointAPI } from "../../api/pointsApi"
import { useAuthStore } from "../../store/authStore"
const DynamicIn = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isLight } = useThemeStore()
  const { get_user } = useAuthStore()
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
        size: iconSize.sm + Math.random() * 10, // varied sizes (14-24px)
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
              <PointsIcon
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
                  This QR code contains your points amount and app email. Scan with eSewa or Khalti to complete payment.
                </Text>
              ) : (
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Enter the points. After entering, we'll generate a dynamic QR for your transaction. Points will be added to your account instantly and can be used for gaming and purchasing in the app.
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
                    size={200}
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

            <View style={[styles.footer, Platform.OS === "android" && { marginBottom: spacing.sm }]}>
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
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    zIndex: 1,
  },
  pointCard: {
    borderRadius: spacing.xs,
    borderWidth: 2,
    padding: spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  cornerDecoration: {
    position: 'absolute',
    width: spacing.xl,
    height: spacing.xl,
    borderWidth: 2,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  angularCut: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  cutTopRight: {
    top: spacing.xl,
    right: -15,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cutBottomLeft: {
    bottom: spacing.xl,
    left: -15,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: fontSize.sm + 1,
    fontWeight: '400',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.xl,
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrWrapper: {
    padding: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  qrInstruction: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    marginTop: 'auto',
    zIndex: 1,
  },
})
