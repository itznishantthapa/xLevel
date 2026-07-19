import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { AppIcon, PointsIcon } from '../../../components/common/AppIcon'
import {
  CheckmarkCircle01Icon,
  CheckIcon,
} from '@hugeicons/core-free-icons'
import { fontSize, spacing, iconSize } from '../../../theme/typography'
import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGameProfiles } from '../../../queries/useGameProfiles'
import { useStoreScreenData } from '../../../hooks/useStoreScreenData'
import {
  CreateGameLayout,
  SectionTitle,
  DividerLine,
  TermsAgreement,
  StoreProfileSection,
  STORE_PROFILE_AGREEMENT_TEXT,
} from '../../../component/customer/createGame'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { useStoreTopup } from '../../../queries/useMutation/useStoreTopup'

// Monochrome accent colors
const ACCENT_PRIMARY = (isLight) => isLight ? '#000000' : '#ffffff'
const ACCENT_ALT = (isLight) => isLight ? '#555555' : '#aaaaaa'

const PUBGStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const { data: gameProfiles = [] } = useGameProfiles()
  const { get_user } = useAuthStore()
  const queryClient = useQueryClient()
  const { mutateAsync: storeTopup } = useStoreTopup()
  const termsRef = useRef(null)
  const slideAnim = useRef(new Animated.Value(0)).current

  // Fetch store items for PUBG
  const { storeItemsData, isOpening: isLoadingStore } = useStoreScreenData('pubg')

  // Selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Profile selection state
  const [profileType, setProfileType] = useState('own') // 'own' or 'other'
  const [customUsername, setCustomUsername] = useState('')
  const [customUid, setCustomUid] = useState('')

  // Get player's PUBG profile from game profiles
  const pubgProfile = gameProfiles.find(
    profile => profile.game_name?.toLowerCase() === 'pubg'
  )
 
  

  // Animate selected item display
  useEffect(() => {
    if (selectedItem) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start()
    } else {
      slideAnim.setValue(0)
    }
  }, [selectedItem])
  
  // Transform backend data to frontend format
  const transformStoreItems = (items) => {
    if (!items || items.length === 0) return []
    
    return items.map(item => ({
      id: item.id,
      type: item.type,
      uc: item.quantity,
      points: item.points,
      image: { uri: item.image },
    }))
  }

  // Store items from API
  const storeItems = transformStoreItems(storeItemsData)

  // Get UC items
  const ucItems = storeItems?.filter(item => item.type === "uc") || []

  // Get the username and UID based on profile type
  const getProfileData = () => {
    if (profileType === 'own') {
      return {
        username: pubgProfile?.game_username || '',
        uid: pubgProfile?.uid || pubgProfile?.game_uid || ''
      }
    }
    return {
      username: customUsername.trim(),
      uid: customUid.trim()
    }
  }

  // Check if form is valid
  const isProfileValid = profileType === 'own' 
    ? (pubgProfile?.game_username && (pubgProfile?.uid || pubgProfile?.game_uid))
    : (customUsername.trim() && customUid.trim())
  const isFormValid = selectedItem && agreementAccepted && isProfileValid

  // Handle confirm purchase
  const handleConfirm = async () => {
    if (!selectedItem) {
      Toast.show('Please select an item', Toast.SHORT)
      return
    }

    if (!agreementAccepted) {
      Toast.show('Please confirm your game profile', Toast.SHORT)
      termsRef.current?.shake()
      return
    }

    const profileData = getProfileData()
    if (!profileData.username || !profileData.uid) {
      Toast.show('Please provide valid username and UID', Toast.SHORT)
      return
    }

    // Prepare payload for backend
    const payload = {
      product_id: selectedItem.id,
      username: profileData.username,
      uid: profileData.uid
    }

    try {
      setIsSubmitting(true)

      // Call the topup mutation
      const response = await storeTopup(payload)
      
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to purchase item.'
      Toast.show(errorMessage, Toast.LONG)
      console.error('Topup Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected item display title
  const getSelectedTitle = (item) => {
    if (item.type === 'uc') return `${item.uc.toLocaleString()} UC`
    return ''
  }

  // Get item type header label
  const getItemTypeHeader = (item) => {
    if (item.type === 'uc') return 'UC'
    return ''
  }

  // Black and white theme
  const themeColor = isLight ? '#000000' : '#ffffff'

  // Render UC option button (Vertical Card)
  const renderUCOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.ucCard,
          {
            backgroundColor: isSelected 
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#f5f5f5' : '#141414'),
            borderColor: isSelected
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#e0e0e0' : '#2a2a2a'),
          },
        ]}
        onPress={() => setSelectedItem(item)}
      >
        {/* Selection checkmark */}
        {isSelected && (
          <View style={styles.selectedMark}>
            <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.sm} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}
        
        {/* UC Icon */}
        <Image 
          source={item.image} 
          style={styles.ucIconImg}
          resizeMode="contain"
        />
        
        {/* UC Label */}
        <Text 
          style={[styles.modeLabel, { color: cardColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          UC
        </Text>
        <Text
          style={[styles.ucCount, {
            color: isSelected 
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#1a1a1a' : '#ffffff'),
          }]}
          numberOfLines={1}
        >
          {item.uc.toLocaleString()}
        </Text>
        
        {/* Points */}
        <View style={styles.ucPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <PointsIcon size={iconSize.xs} color={isSelected && !isLight ? '#000000' : '#00bf63'} />
          <Text style={[styles.ucPrice, {
            color: isSelected 
              ? (isLight ? '#00bf63' : '#000000')
              : (isLight ? '#00bf63' : '#ffffff')
          }]}>
            {item.points} point
          </Text>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
        </View>
      </Pressable>
    )
  }

  return (
    <CreateGameLayout
      storeKey="pubg"
      gameLogoUrl={game?.game_logo_url}
      title="PUBG Store"
      isLight={isLight}
      isLoading={isLoadingStore || isSubmitting}
      onSubmit={handleConfirm}
      buttonTitle={isSubmitting ? "Purchasing..." : "Confirm Purchase"}
      loaderMessage={isSubmitting ? "Processing..." : "Opening Store..."}
      aboveButtonContent={
        selectedItem && (
          <Animated.View 
            style={[styles.selectedItemDisplay, {
              backgroundColor: 'transparent',
              position: 'relative',
              transform: [
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })},
                { scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                })}
              ],
              opacity: slideAnim,
            }]}
          >
            <View style={styles.selectedItemContainer}>
              <Text style={[styles.selectedItemHeader, { color: ACCENT_PRIMARY(isLight) }]}>
                {getItemTypeHeader(selectedItem)}
              </Text>
              <View style={styles.selectedItemRow}>
                <View style={styles.selectedItemLeft}>
                  <View style={[styles.selectedItemIconWrapper, {
                    backgroundColor: 'transparent',
                  }]}>
                    <Image 
                      source={selectedItem.image} 
                      style={styles.selectedItemIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={[styles.modeLabel, { color: ACCENT_PRIMARY(isLight) }]}>
                      YOUR TOP-UP
                    </Text>
                    <Text style={[styles.selectedItemTitle, { color: isLight ? '#000000' : '#ffffff' }]}>
                      {getSelectedTitle(selectedItem)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.selectedItemRight, {
                  backgroundColor: 'transparent',
                  borderColor: isLight ? '#e0e0e0' : '#333333',
                }]}>
                  <View style={[styles.priceLine, { backgroundColor: isLight ? '#cccccc' : '#444444' }]} />
                  <PointsIcon size={iconSize.xs} color="#00bf63" />
                  <Text style={[styles.selectedItemPoints, { color: '#00bf63' }]}>
                    {selectedItem.points} point
                  </Text>
                  <View style={[styles.priceLine, { backgroundColor: isLight ? '#cccccc' : '#444444' }]} />
                </View>
              </View>
            </View>
          </Animated.View>
        )
      }
    >
      {/* UC Packages */}
      <View style={styles.section}>
        <SectionTitle title="UC Packages" isLight={isLight} />
        <View style={styles.optionsGrid}>
          {ucItems.map((item, index) => renderUCOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />
      
      <View style={styles.section}>
        <SectionTitle title="Select Profile" isLight={isLight} />
        <StoreProfileSection
          isLight={isLight}
          profileType={profileType}
          setProfileType={setProfileType}
          ownFields={[
            { label: 'Game Name', value: pubgProfile?.game_username },
            { label: 'UID', value: pubgProfile?.uid || pubgProfile?.game_uid },
          ]}
          otherFields={[
            {
              placeholder: 'Game Name',
              value: customUsername,
              onChangeText: setCustomUsername,
            },
            {
              placeholder: 'UID',
              value: customUid,
              onChangeText: setCustomUid,
              keyboardType: 'number-pad',
            },
          ]}
        />
      </View>

      {/* Terms Agreement */}
      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={() => setAgreementAccepted(!agreementAccepted)}
        isLight={isLight}
        text={STORE_PROFILE_AGREEMENT_TEXT}
      />
    </CreateGameLayout>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fontSize.xs,
  },
  // Vertical UC Card Styles (2 columns layout)
  ucCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: fontSize.base,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  modeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: spacing.xxs,
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
  },
  ucIconImg: {
    width: 70,
    height: 70,
    marginBottom: spacing.sm,
  },
  ucCount: {
    fontSize: spacing.xl,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  ucPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ucPrice: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceLine: {
    width: 14,
    height: 1,
    opacity: 0.8,
  },
  selectedMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  selectedItemDisplay: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedItemContainer: {
    width: '100%',
  },
  selectedItemHeader: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: fontSize.xs,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedItemIconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItemIcon: {
    width: 26,
    height: 26,
  },
  selectedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedItemPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00bf63',
  },
})

export default PUBGStore
