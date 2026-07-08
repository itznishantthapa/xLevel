import { View, Text, StyleSheet, Image, Pressable, TextInput } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { AppIcon, PointsIcon } from '../../../components/common/AppIcon'
import {
  CheckmarkCircle01Icon,
  SecurityCheckIcon,
  FlashIcon,
  Shield01Icon,
  Touch01Icon,
  UserIcon,
  UserArrowLeftRightIcon,
  IdentityCardIcon,
  GamepadIcon,
  LabelIcon,
  Location01Icon,
  CheckIcon,
  RefreshIcon,
  ImageAdd01Icon,
  Dollar01Icon,
  ArrowRight01Icon,
  Mail01Icon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '@hugeicons/core-free-icons'
import { iconSize } from '../../../theme/typography'
import { useState, useRef, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGameProfiles } from '../../../queries/useGameProfiles'
import { useStoreItems } from '../../../queries/useStoreItems'
import { CreateGameLayout, SectionTitle, DividerLine, TermsAgreement } from '../../../component/customer/createGame'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { useStoreTopup } from '../../../queries/useMutation/useStoreTopup'
import * as ImagePicker from 'expo-image-picker'

// Monochrome accent colors
const ACCENT_PRIMARY = (isLight) => isLight ? '#000000' : '#ffffff'
const ACCENT_ALT = (isLight) => isLight ? '#555555' : '#aaaaaa'

const EfootballStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const { get_user } = useAuthStore()
  const queryClient = useQueryClient()
  const { mutateAsync: storeTopup } = useStoreTopup()
  const termsRef = useRef(null)

  // Fetch store items for Efootball
  const { data: storeItemsData, isLoading: isLoadingStore } = useStoreItems('efootball')

  // Form state
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotResult, setScreenshotResult] = useState(null)
  const [dollarAmount, setDollarAmount] = useState('')
  const [konamiEmail, setKonamiEmail] = useState('')
  const [konamiPassword, setKonamiPassword] = useState('')
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Get OneDollarPrice from store items
  const oneDollarPrice = storeItemsData?.find(item => item.label === 'OneDollarPrice')?.points || 148

  // Calculate game points with 10% service charge
  const calculatedGamePoints = useMemo(() => {
    const amount = parseFloat(dollarAmount)
    if (isNaN(amount) || amount <= 0) return 0
    return Math.ceil(amount * oneDollarPrice * 1.10)
  }, [dollarAmount, oneDollarPrice])

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 1,
      })

      if (!result.canceled) {
        setScreenshotResult(result.assets[0])
        setScreenshot(result.assets[0].uri)
      }
    } catch (error) {
      Toast.show("Unable to pick image", Toast.SHORT)
    }
  }

  // Form validation
  const isFormValid = screenshot && 
                      dollarAmount && 
                      parseFloat(dollarAmount) > 0 && 
                      konamiEmail.trim() && 
                      konamiPassword.trim() && 
                      agreementAccepted

  // Handle confirm purchase
  const handleConfirm = async () => {
    if (!screenshot) {
      Toast.show('Please upload item screenshot', Toast.SHORT)
      return
    }

    if (!dollarAmount || parseFloat(dollarAmount) <= 0) {
      Toast.show('Please enter valid item price', Toast.SHORT)
      return
    }

    if (!konamiEmail.trim()) {
      Toast.show('Please enter Konami email', Toast.SHORT)
      return
    }

    if (!konamiPassword.trim()) {
      Toast.show('Please enter Konami password', Toast.SHORT)
      return
    }

    if (!agreementAccepted) {
      Toast.show('Please confirm your details are correct', Toast.SHORT)
      termsRef.current?.shake()
      return
    }

    // Prepare payload for backend
    const formData = new FormData()
    
    // Add screenshot
    if (screenshotResult) {
      formData.append('screenshot', {
        uri: screenshot,
        name: 'efootball_screenshot.jpg',
        type: screenshotResult.mimeType || 'image/jpeg'
      })
    }
    
    formData.append('calculated_game_point', calculatedGamePoints.toString())
    formData.append('email', konamiEmail.trim())
    formData.append('password', konamiPassword.trim())

    try {
      setIsSubmitting(true)

      // Call the topup mutation
      const response = await storeTopup(formData)
      
      // Refresh user data to get updated wallet balance
      await get_user()

      // Navigate to gamePoints screen
      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'gamePoints' }
        ],
      })

    } catch (error) {
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process request.'
      Toast.show(errorMessage, Toast.LONG)
      console.error('Topup Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CreateGameLayout
      title="Efootball Store"
      isLight={isLight}
      isLoading={isLoadingStore || isSubmitting}
      onSubmit={handleConfirm}
      buttonTitle={isSubmitting ? "Processing..." : "Confirm Purchase"}
      loaderMessage={isSubmitting ? "Processing" : "Opening"}
    >
      {/* Game Info Header */}
      <View style={[styles.gameHeader, { 
        backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
        borderColor: isLight ? "#cccccc" : "#333333",
        borderRadius: 12,
      }]}>
        <Image source={{ uri: game?.game_logo_url }} style={styles.gameLogo} />
        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, { color: isLight ? '#000000' : '#ffffff' }]}>
            {game?.game_name || 'eFootball'}
          </Text>
          <View style={styles.securityBadge}>
            <AppIcon icon={SecurityCheckIcon} size={iconSize.xs} color="#00bf63" />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              100% Secure
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <AppIcon icon={FlashIcon} size={iconSize.xs} color="#F97316" />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Fast
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <AppIcon icon={Shield01Icon} size={iconSize.xs} color="#6366F1" />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Reliable
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <AppIcon icon={Touch01Icon} size={iconSize.xs} color="#14B8A6" />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Easy
            </Text>
          </View>
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Screenshot Upload Section */}
      <View style={styles.section}>
        <SectionTitle title="Item Screenshot" isLight={isLight} />
        
        {screenshot ? (
          <View style={styles.selectedImageWrapper}>
            <View style={[styles.imagePreviewCard, {
              backgroundColor: isLight ? "#ffffff" : "#141414",
              borderColor: isLight ? "#e0e0e0" : "#2a2a2a",
            }]}>
              <Image
                source={{ uri: screenshot }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
            
            <Pressable
              style={[styles.changeButton, {
                backgroundColor: isLight ? "#f8f8f8" : "#1a1a1a",
                borderColor: isLight ? "#cccccc" : "#333333",
              }]}
              onPress={pickImage}
            >
              <AppIcon icon={RefreshIcon} size={iconSize.sm} color={isLight ? "#666666" : "#cccccc"} />
              <Text style={[
                styles.changeButtonText,
                { color: isLight ? "#666666" : "#cccccc" }
              ]}>
                Change Screenshot
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[
              styles.imagePickerButton,
              {
                backgroundColor:"transparent",
                borderColor: isLight ? "#cccccc" : "#333333",
              }
            ]}
            onPress={pickImage}
          >
            <View style={styles.placeholderContainer}>
              <AppIcon icon={ImageAdd01Icon} size={40} color={isLight ? "#666666" : "#999999"} />
              <Text style={[
                styles.uploadText,
                { color: isLight ? "#666666" : "#cccccc" }
              ]}>
                Tap to Upload Item Screenshot
              </Text>
              <Text style={[
                styles.uploadHint,
                { color: isLight ? "#999999" : "#666666" }
              ]}>
                Upload a clear screenshot of the item you want to purchase
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <DividerLine isLight={isLight} />

      {/* Price Input Section */}
      <View style={styles.section}>
        <SectionTitle title="Item Price" isLight={isLight} />
        
        <View style={styles.priceContainer}>
          {/* Dollar Input */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <View style={[styles.inputContainer, {
              borderColor: isLight ? '#cccccc' : '#333333',
            backgroundColor:"transparent",
            }]}>
              <AppIcon icon={Dollar01Icon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
              <TextInput
                style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder="0.00"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={dollarAmount}
                onChangeText={setDollarAmount}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.currencyLabel, { color: isLight ? '#666666' : '#999999' }]}>
                USD
              </Text>
            </View>
            <Text style={[styles.inputLabel, { color: isLight ? '#888888' : '#777777' }]}>
              Item Price
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrowWrapper}>
            <AppIcon icon={ArrowRight01Icon} size={iconSize.lg} color={isLight ? '#cccccc' : '#444444'} />
          </View>

          {/* Game Points Display */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <View style={[styles.pointsDisplay, {
              borderColor: isLight ? '#00bf63' : '#00bf63',
              backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 191, 99, 0.1)',
            }]}>
              <PointsIcon size={iconSize.md} color="#00bf63" />
              <Text style={[styles.pointsValue, { color: '#00bf63' }]}>
                {calculatedGamePoints}
              </Text>
            </View>
            <Text style={[styles.inputLabel, { color: isLight ? '#888888' : '#777777' }]}>
              Game Points
            </Text>
          </View>
        </View>

        {/* Price Breakdown */}
        {calculatedGamePoints > 0 && (
          <View style={[styles.breakdownBox, {
        backgroundColor:"transparent",
            borderColor: isLight ? '#e0e0e0' : '#2a2a2a',
          }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: isLight ? '#666666' : '#999999' }]}>
                Base Price ({dollarAmount} × {oneDollarPrice} NPR)
              </Text>
              <Text style={[styles.breakdownValue, { color: isLight ? '#333333' : '#cccccc' }]}>
                {Math.ceil(parseFloat(dollarAmount || 0) * oneDollarPrice)} points
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: isLight ? '#666666' : '#999999' }]}>
                Service Charge (10%)
              </Text>
              <Text style={[styles.breakdownValue, { color: isLight ? '#333333' : '#cccccc' }]}>
                {Math.ceil(parseFloat(dollarAmount || 0) * oneDollarPrice * 0.10)} points
              </Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: isLight ? '#e0e0e0' : '#2a2a2a' }]} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#00bf63', fontWeight: '700' }]}>
                Total Points
              </Text>
              <Text style={[styles.breakdownValue, { color: '#00bf63', fontWeight: '700', fontSize: 16 }]}>
                {calculatedGamePoints} points
              </Text>
            </View>
          </View>
        )}
      </View>

      <DividerLine isLight={isLight} />

      {/* Konami Account Section */}
      <View style={styles.section}>
        <SectionTitle title="Konami Account" isLight={isLight} />
        
        <View style={styles.customProfileContainer}>
          <View style={[styles.inputContainer, {
            borderColor: isLight ? '#cccccc' : '#333333',
            backgroundColor:"transparent",
          }]}>
            <AppIcon icon={Mail01Icon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
            <TextInput
              style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
              placeholder="Konami Email"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={konamiEmail}
              onChangeText={setKonamiEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <View style={[styles.inputContainer, {
            borderColor: isLight ? '#cccccc' : '#333333',
            backgroundColor:"transparent",
          }]}>
            <AppIcon icon={LockIcon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
            <TextInput
              style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
              placeholder="Konami Password"
              placeholderTextColor={isLight ? '#999999' : '#666666'}
              value={konamiPassword}
              onChangeText={setKonamiPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <AppIcon icon={showPassword ? EyeIcon : EyeOffIcon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Terms Agreement */}
      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={() => setAgreementAccepted(!agreementAccepted)}
        isLight={isLight}
        text="Account confirmed & false requests cost 20 points."
      />
    </CreateGameLayout>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  gameHeader: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  gameLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    fontSize: 10,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    overflow: 'hidden',
  },
  selectedImageWrapper: {
    gap: 10,
  },
  imagePreviewCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 6,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  uploadHint: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inputWrapper: {
    gap: 6,
  },
  arrowWrapper: {
    paddingTop: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  currencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 2,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  breakdownBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  customProfileContainer: {
    gap: 10,
  },
})

export default EfootballStore
