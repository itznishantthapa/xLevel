import { View, Text, StyleSheet, Image, Pressable, TextInput } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { AppIcon, PointsIcon } from '../../../components/common/AppIcon'
import FloatingInput from '../../../components/common/FloatingInput'
import {
  RefreshIcon,
  ImageAdd01Icon,
  Dollar01Icon,
  ArrowRight01Icon,
  Mail01Icon,
  LockIcon,
} from '@hugeicons/core-free-icons'
import { fontSize, iconSize, spacing, radius } from '../../../theme/typography'
import { useMemo, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useStoreScreenData } from '../../../hooks/useStoreScreenData'
import { CreateGameLayout, DividerLine, TermsAgreement } from '../../../component/customer/createGame'
import { useAuthStore } from '../../../store/authStore'
import { useStoreTopup } from '../../../queries/useMutation/useStoreTopup'
import * as ImagePicker from 'expo-image-picker'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PRICE_REGEX = /^\d+(\.\d{1,2})?$/

const EfootballStore = () => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const { get_user } = useAuthStore()
  const { mutateAsync: storeTopup } = useStoreTopup()
  const termsRef = useRef(null)

  const { storeItemsData, isOpening: isLoadingStore } = useStoreScreenData('efootball')

  const [screenshot, setScreenshot] = useState(null)
  const [screenshotResult, setScreenshotResult] = useState(null)
  const [dollarAmount, setDollarAmount] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const oneDollarPrice = storeItemsData?.find((item) => item.label === 'OneDollarPrice')?.points || 148

  const calculatedGamePoints = useMemo(() => {
    const amount = parseFloat(dollarAmount)
    if (isNaN(amount) || amount <= 0) return 0
    return Math.ceil(amount * oneDollarPrice)
  }, [dollarAmount, oneDollarPrice])

  const colors = useMemo(
    () => ({
      cardBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
      inputBackground: isLight ? '#f5f5f5' : '#1a1a1a',
      surface: isLight ? '#ffffff' : '#0a0a0a',
      text: isLight ? '#000000' : '#ffffff',
      textSecondary: isLight ? 'rgba(51, 51, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      textTertiary: isLight ? '#666666' : '#999999',
      textMuted: isLight ? '#666666' : '#999999',
      border: isLight ? '#eaeaea' : 'rgba(255, 255, 255, 0.3)',
      error: '#ef4444',
      accent: '#00bf63',
      accentSoft: isLight ? '#f0fdf4' : 'rgba(0, 191, 99, 0.1)',
    }),
    [isLight],
  )

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 1,
      })

      if (!result.canceled) {
        setScreenshotResult(result.assets[0])
        setScreenshot(result.assets[0].uri)
        setFieldErrors((prev) => ({ ...prev, screenshot: '' }))
      }
    } catch (error) {
      Toast.show('Unable to pick image', Toast.SHORT)
    }
  }

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  const validateForm = () => {
    const errors = {}
    const trimmedPrice = dollarAmount.trim()
    const trimmedEmail = accountEmail.trim()

    if (!screenshot) {
      errors.screenshot = 'Please upload an item screenshot'
    }

    if (!trimmedPrice) {
      errors.price = 'Please enter the item price'
    } else if (!PRICE_REGEX.test(trimmedPrice)) {
      errors.price = 'Enter a valid price (up to 2 decimal places)'
    } else if (parseFloat(trimmedPrice) <= 0) {
      errors.price = 'Item price must be greater than 0'
    }

    if (!trimmedEmail) {
      errors.email = 'Please enter your account email'
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!accountPassword.trim()) {
      errors.password = 'Please enter your account password'
    }

    if (!agreementAccepted) {
      errors.agreement = 'Please confirm your account info is correct'
    }

    setFieldErrors(errors)

    const hasErrors = Boolean(
      errors.screenshot ||
      errors.price ||
      errors.email ||
      errors.password ||
      errors.agreement,
    )

    if (hasErrors) {
      if (errors.agreement) {
        termsRef.current?.shake()
      }
      return false
    }

    return true
  }

  const handleConfirm = async () => {
    if (!validateForm()) {
      return
    }

    const formData = new FormData()

    if (screenshotResult) {
      formData.append('screenshot', {
        uri: screenshot,
        name: 'efootball_screenshot.jpg',
        type: screenshotResult.mimeType || 'image/jpeg',
      })
    }

    formData.append('calculated_game_point', calculatedGamePoints.toString())
    formData.append('email', accountEmail.trim())
    formData.append('password', accountPassword.trim())

    try {
      setIsSubmitting(true)
      await storeTopup(formData)
      await get_user()

      navigation.reset({
        index: 1,
        routes: [{ name: 'customerTabs' }, { name: 'gamePoints' }],
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process request.'
      Toast.show(errorMessage, Toast.LONG)
      console.error('Topup Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CreateGameLayout
      storeKey="efootball"
      title="Efootball, FC & More"
      isLight={isLight}
      isLoading={isLoadingStore || isSubmitting}
      isFormValid
      onSubmit={handleConfirm}
      buttonTitle={isSubmitting ? 'Purchasing...' : 'Confirm Purchase'}
      loaderMessage={isSubmitting ? 'Processing...' : 'Opening Store...'}
    >
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Screenshot</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Upload a clear screenshot of the item you want to purchase
          </Text>
        </View>

        {screenshot ? (
          <View style={styles.selectedImageWrapper}>
            <View
              style={[
                styles.imagePreviewCard,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image source={{ uri: screenshot }} style={styles.previewImage} resizeMode="contain" />
            </View>

            <Pressable
              style={[
                styles.changeButton,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
              onPress={pickImage}
            >
              <AppIcon icon={RefreshIcon} size={iconSize.sm} color={colors.textTertiary} />
              <Text style={[styles.changeButtonText, { color: colors.textSecondary }]}>
                Change Screenshot
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
              style={[
                styles.imagePickerButton,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: fieldErrors.screenshot ? colors.error : colors.border,
                },
              ]}
            onPress={pickImage}
          >
            <View style={styles.placeholderContainer}>
              <AppIcon icon={ImageAdd01Icon} size={iconSize.xl} color={colors.textTertiary} />
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                Tap to upload screenshot
              </Text>
              <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>
                PNG or JPG · item details visible
              </Text>
            </View>
          </Pressable>
        )}

        {fieldErrors.screenshot ? (
          <Text style={[styles.fieldErrorText, { color: colors.error }]}>{fieldErrors.screenshot}</Text>
        ) : null}

        <DividerLine isLight={isLight} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Price</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Enter the item price in USD to see your total game points
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <View
                  style={[
                  styles.priceInputShell,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: fieldErrors.price ? colors.error : colors.border,
                  },
                ]}
              >
                <AppIcon icon={Dollar01Icon} size={iconSize.md} color={colors.textTertiary} />
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={dollarAmount}
                  onChangeText={(text) => {
                    setDollarAmount(text)
                    clearFieldError('price')
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.currencyLabel, { color: colors.textTertiary }]}>USD</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Price (USD)</Text>
              {fieldErrors.price ? (
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>{fieldErrors.price}</Text>
              ) : null}
            </View>

            <View style={styles.arrowWrapper}>
              <AppIcon icon={ArrowRight01Icon} size={iconSize.lg} color={colors.textTertiary} />
            </View>

            <View style={styles.priceField}>
              <View
                style={[
                  styles.pointsDisplay,
                  {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSoft,
                  },
                ]}
              >
                <PointsIcon size={iconSize.md} color={colors.accent} />
                <Text style={[styles.pointsValue, { color: colors.accent }]}>
                  {calculatedGamePoints}
                </Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Total Game Points</Text>
            </View>
          </View>
        </View>

        <DividerLine isLight={isLight} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Login Info</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Provide the login details for your account.
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
          <FloatingInput
            label="Account email"
            value={accountEmail}
            onChangeText={(text) => {
              setAccountEmail(text)
              clearFieldError('email')
            }}
            icon={Mail01Icon}
            keyboardType="email-address"
            error={fieldErrors.email}
            colors={colors}
          />

          <FloatingInput
            label="Account Password"
            value={accountPassword}
            onChangeText={(text) => {
              setAccountPassword(text)
              clearFieldError('password')
            }}
            icon={LockIcon}
            secureTextEntry={!showPassword}
            secureVisible={showPassword}
            onToggleSecure={() => setShowPassword(!showPassword)}
            error={fieldErrors.password}
            colors={colors}
          />
        </View>
      </View>

      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={() => {
          setAgreementAccepted(!agreementAccepted)
          clearFieldError('agreement')
        }}
        isLight={isLight}
        text="I confirm my account info is correct. (Do not submit false requests, submission may fine you 20 points)"
      />
    </CreateGameLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    lineHeight: 18,
  },
  formCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  imagePickerButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  selectedImageWrapper: {
    gap: spacing.sm,
  },
  imagePreviewCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.sm,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  changeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  uploadHint: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
    gap: spacing.xs,
  },
  priceInputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    padding: 0,
  },
  currencyLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  arrowWrapper: {
    paddingTop: spacing.md + 2,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: radius.md,
    minHeight: 48,
  },
  pointsValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
})

export default EfootballStore
