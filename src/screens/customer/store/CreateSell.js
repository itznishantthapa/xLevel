import React, { useState, useCallback, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  Image,
  TextInput,
} from 'react-native'
import { AppIcon, PointsIcon } from '../../../components/common/AppIcon'
import {
  CancelCircleIcon,
  Add01Icon,
  Image01Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'
import { iconSize } from '../../../theme/typography'
import * as ImagePicker from 'expo-image-picker'
import * as yup from 'yup'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { useAuthStore } from '../../../store/authStore'
import { useNavigation } from '@react-navigation/native'
import CreateGameLayout from '../../../component/customer/createGame/CreateGameLayout'
import TermsAgreement from '../../../component/customer/createGame/TermsAgreement'
import { useCreateGameAccount } from '../../../queries/useMutation/useCreateGameAccount'

const { width } = Dimensions.get('window')

const MAX_IMAGES = 6
const SERVICE_CHARGE_PERCENT = 10
const REQUIRED_DEPOSIT = 50

const GAME_OPTIONS = [
  { label: 'FreeFire', value: 'FreeFire' },
  { label: 'eFootball', value: 'eFootball' },
  { label: 'PUBG', value: 'PUBG' },
  { label: 'MLBB', value: 'MLBB' },
]

// Validation Schema
const validationSchema = yup.object().shape({
  images: yup.array().min(1, 'Please add at least one screenshot').required(),
  description: yup
    .string()
    .required('Please add a description')
    .min(1, 'Please add a description'),
  selectedGame: yup
    .string()
    .required('Please select a game')
    .nullable(),
  sellerPhone: yup
    .string()
    .required('Please enter your WhatsApp number')
    .matches(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits'),
  price: yup
    .number()
    .required('Please enter a valid price')
    .min(1, 'Please enter a valid price'),
})

const CreateSell = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const navigation = useNavigation()
  const { mutate: createAccount, isPending: isSubmitting } = useCreateGameAccount()
  const termsRef = useRef(null)

  const [images, setImages] = useState([])
  const [description, setDescription] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [sellerPhone, setSellerPhone] = useState('')
  const [price, setPrice] = useState('')
  const [loginDetailsAcknowledged, setLoginDetailsAcknowledged] = useState(false)

  const userBalance = user?.wallet_balance ?? 0

  const numericPrice = parseInt(price) || 0
  const serviceCharge = Math.ceil(numericPrice * SERVICE_CHARGE_PERCENT / 100)
  const sellerReceives = numericPrice - serviceCharge

  const colors = {
    text: isLight ? '#1a1a1a' : '#ffffff',
    textSecondary: isLight ? '#666666' : '#999999',
    inputBg: isLight ? '#f5f5f5' : '#1a1a1a',
    inputBorder: isLight ? '#cccccc' : '#333333',
    accent: '#00bf63',
    danger: '#FF4444',
  }

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Toast.show(`Maximum ${MAX_IMAGES} images allowed`, Toast.SHORT)
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
      })

      if (!result.canceled) {
        const newImages = [...images, ...result.assets].slice(0, MAX_IMAGES)
        setImages(newImages)
      }
    } catch (error) {
      if (__DEV__) console.log('Image picker error:', error)
      Toast.show('Unable to pick images', Toast.SHORT)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = async () => {
    try {
      await validationSchema.validate(
        {
          images,
          description,
          selectedGame,
          sellerPhone,
          price: numericPrice,
        },
        { abortEarly: true }
      )
      return true
    } catch (error) {
      Toast.show(error.message, Toast.SHORT)
      return false
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!loginDetailsAcknowledged) {
      termsRef.current?.shake()
      return
    }

    if (!(await validateForm())) return

    const formData = new FormData()
    formData.append('game', selectedGame)
    formData.append('description', description.trim())
    formData.append('login_method', 'whatsapp')
    formData.append('contact_number', sellerPhone.trim())
    formData.append('price', numericPrice.toString())

    images.forEach((img) => {
      formData.append('images', {
        uri: img.uri,
        type: img.mimeType || 'image/jpeg',
        name: img.fileName || `screenshot_${Date.now()}.jpg`,
      })
    })

    createAccount(formData, {
      onSuccess: (data) => {
        navigation.goBack()
      },
      onError: (error) => {
        Toast.show(error?.message || 'Failed to list account.', Toast.SHORT)
      },
    })
  }, [loginDetailsAcknowledged, selectedGame, description, sellerPhone, numericPrice, images, createAccount, navigation])

  const renderImageSlot = (index) => {
    const image = images[index]
    if (image) {
      return (
        <View key={index} style={[styles.imageSlot, { borderColor: colors.inputBorder }]}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
            <AppIcon icon={CancelCircleIcon} size={iconSize.sm} color={colors.danger} />
          </Pressable>
        </View>
      )
    }

    if (index === images.length) {
      return (
        <Pressable
          key={index}
          style={[styles.imageSlot, styles.addImageSlot, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
          onPress={pickImages}
        >
          <AppIcon icon={Add01Icon} size={iconSize.lg} color={colors.textSecondary} />
          <Text style={[styles.addImageText, { color: colors.textSecondary }]}>Add</Text>
        </Pressable>
      )
    }

    return (
      <View
        key={index}
        style={[styles.imageSlot, styles.emptyImageSlot, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
      >
        <AppIcon icon={Image01Icon} size={iconSize.sm} color={isLight ? '#d0d0d0' : '#333333'} />
      </View>
    )
  }

  return (
    <CreateGameLayout
      title="List Account"
      isLight={isLight}
      isLoading={isSubmitting}
      onSubmit={handleSubmit}
      buttonTitle="List for Sale"
      loaderMessage="Listing account..."
    >
      {/* Security Notice */}
      <View style={[styles.securityNoticeContainer, { borderColor: isLight ? '#000000' : '#ffffff', backgroundColor: colors.inputBg }]}>
        <Text style={[styles.securityNoticeText, { color: isLight ? '#000000' : '#ffffff' }]}>
          Login credentials are only accessed by admin for verification. After a successful purchase, login details are securely transferred to the buyer.
        </Text>
      </View>

      {/* Game Selection - Option Boxes */}
      <View style={[styles.inputGroup,{ marginTop: 12}]}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Game Account *</Text>
        <View style={styles.optionGrid}>
          {GAME_OPTIONS.map((game) => {
            const isSelected = selectedGame === game.value
            return (
              <Pressable
                key={game.value}
                style={[
                  styles.optionBox,
                  {
                    backgroundColor: isSelected
                      ? (isLight ? '#000000' : '#ffffff')
                      : colors.inputBg,
                    borderColor: isSelected
                      ? (isLight ? '#000000' : '#ffffff')
                      : colors.inputBorder,
                  },
                ]}
                onPress={() => setSelectedGame(game.value)}
              >
                <Text
                  style={[
                    styles.optionBoxText,
                    {
                      color: isSelected
                        ? (isLight ? '#ffffff' : '#000000')
                        : colors.text,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {game.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Screenshots Section */}
      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Screenshots</Text>
        <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
          Add up to {MAX_IMAGES} screenshots of your account
        </Text>
        <View style={styles.imageGrid}>
          {Array.from({ length: MAX_IMAGES }).map((_, index) => renderImageSlot(index))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Description *</Text>
        <View style={[styles.textAreaWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text, maxHeight: 180 }]}
            placeholder="Write a description to attract buyers..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            maxLength={250}
            numberOfLines={10}
            value={description}
            onChangeText={text => {
              // Limit to 10 lines visually and in content
              const lines = text.split(/\r?\n/)
              if (lines.length > 10) {
                setDescription(lines.slice(0, 10).join('\n'))
              } else {
                setDescription(text)
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                const lines = description.split(/\r?\n/)
                if (lines.length >= 10) {
                  nativeEvent.preventDefault && nativeEvent.preventDefault()
                }
              }
            }}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {description.length}/250
          </Text>
        </View>
      </View>

      {/* Seller Phone */}
      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>WhatsApp Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="For buyer to message you"
          placeholderTextColor={colors.textSecondary}
          value={sellerPhone}
          onChangeText={(text) => setSellerPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
        />
        {sellerPhone && sellerPhone.length !== 10 && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            WhatsApp number must be exactly 10 digits
          </Text>
        )}
      </View>

      {/* Price Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Price (Points) *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Enter price in points"
          placeholderTextColor={colors.textSecondary}
          value={price}
          onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
        />
      </View>

      {/* Price Breakdown */}
      {numericPrice > 0 && (
        <View style={[styles.priceBreakdown, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Listing price</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>{numericPrice.toLocaleString()} points</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Service charge ({SERVICE_CHARGE_PERCENT}%)</Text>
            <Text style={[styles.priceValue, { color: colors.danger }]}>-{serviceCharge.toLocaleString()} points</Text>
          </View>
          <View style={[styles.priceDivider, { borderTopColor: colors.inputBorder }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text, fontWeight: '600' }]}>You receive</Text>
            <View style={styles.priceReceiveRow}>
              <PointsIcon size={iconSize.xs} color={colors.accent} />
              <Text style={[styles.priceValue, { color: colors.accent, fontWeight: '700' }]}>{sellerReceives.toLocaleString()} points</Text>
            </View>
          </View>
        </View>
      )}

      {/* Deposit Info - info container style like deletion screen */}
      <View style={[styles.infoContainer, { backgroundColor: colors.inputBg }]}>
        <AppIcon icon={InformationCircleIcon} size={iconSize.sm} color={colors.textSecondary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          A refundable deposit of {REQUIRED_DEPOSIT} points is required to list your account. This will be returned to you after a successful sale.
        </Text>
      </View>

      <TermsAgreement
        ref={termsRef}
        isAccepted={loginDetailsAcknowledged}
        onToggle={() => setLoginDetailsAcknowledged((prev) => !prev)}
        isLight={isLight}
        text="Admin will message you for your login details to validate the account."
      />

    </CreateGameLayout>
  )
}

export default CreateSell

const styles = StyleSheet.create({
  // Form
  inputGroup: {
    gap: 6,
    marginBottom: 12,

  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 6,
  },

  // Notice (updated to infoContainer style)
  noticeContainer: {
    marginTop: 16,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Security Notice Container (outlined design)
  securityNoticeContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  securityNoticeText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Info container (matches AccountDeletion style - with icon)
  infoContainer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // Images
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageSlot: {
    width: (width - 52) / 3,
    height: (width - 52) / 3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  addImageSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  emptyImageSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
  },
  addImageText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },

  // Inputs
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 0,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 0,
    minHeight: 100,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    fontSize: 14,
    minHeight: 76,
  },
  charCount: {
    fontSize: 10,
    textAlign: 'right',
    position: 'absolute',
    bottom: 8,
    right: 12,
  },

  // Game Option Boxes
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
  },
  optionBoxText: {
    fontSize: 14,
  },

  // Price Breakdown
  priceBreakdown: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceReceiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceDivider: {
    borderTopWidth: 1,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
})
