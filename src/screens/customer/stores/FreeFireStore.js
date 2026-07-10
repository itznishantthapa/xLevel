import { View, Text, StyleSheet, Image, Pressable, TextInput, Animated } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { AppIcon, PointsIcon } from '../../../components/common/AppIcon'
import {
  CheckmarkCircle01Icon,
  UserIcon,
  UserArrowLeftRightIcon,
  IdentityCardIcon,
  GameController03Icon,
  LabelIcon,
  Location01Icon,
  CheckIcon,
} from '@hugeicons/core-free-icons'
import { fontSize, spacing, iconSize } from '../../../theme/typography'
import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGameProfiles } from '../../../queries/useGameProfiles'
import { useStoreItems } from '../../../queries/useStoreItems'
import { CreateGameLayout, SectionTitle, DividerLine, TermsAgreement } from '../../../component/customer/createGame'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { useStoreTopup } from '../../../queries/useMutation/useStoreTopup'

// Monochrome accent colors
const ACCENT_PRIMARY = (isLight) => isLight ? '#000000' : '#ffffff'
const ACCENT_ALT = (isLight) => isLight ? '#555555' : '#aaaaaa'

const FreeFireStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const { data: gameProfiles = [] } = useGameProfiles()
  const { get_user, update_wallet_balance } = useAuthStore()
  const queryClient = useQueryClient()
  const { mutateAsync: storeTopup } = useStoreTopup()
  const termsRef = useRef(null)
  const slideAnim = useRef(new Animated.Value(0)).current

  // Fetch store items for Free Fire
  const { data: storeItemsData, isLoading: isLoadingStore } = useStoreItems('freefire')

  // Selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Profile selection state
  const [profileType, setProfileType] = useState('own') // 'own' or 'other'
  const [customUsername, setCustomUsername] = useState('')
  const [customUid, setCustomUid] = useState('')

  // Get player's Free Fire profile from game profiles
  const freeFireProfile = gameProfiles.find(
    profile => profile.game_name?.toLowerCase() === 'free fire'
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
    
    return items.map(item => {
      const transformed = {
        id: item.id,
        type: item.type,
        points: item.points,
        image: { uri: item.image },
      }

      // Add type-specific fields based on quantity and label
      if (item.type === 'diamond') {
        transformed.diamonds = item.quantity
      } else if (item.type === 'membership') {
        // Extract membership type from label (e.g., "Weekly Light Membership" -> "weekly-light")
        const membershipType = item.label
          .replace(' Membership', '')
          .toLowerCase()
          .replace(/\s+/g, '-')
        transformed.membership = membershipType
      } else if (item.type === 'levelup') {
        transformed.level = String(item.quantity)
      } else if (item.type === 'evoaccess') {
        transformed.day = `${item.quantity}D`
      }

      return transformed
    })
  }

  // Store items from API
  const storeItems = transformStoreItems(storeItemsData)

  // Separate item types
  const diamonds = storeItems?.filter(item => item.type === "diamond") || []
  const memberships = storeItems?.filter(item => item.type === "membership") || []
  const levelups = storeItems?.filter(item => item.type === "levelup") || []
  const evoaccesses = storeItems?.filter(item => item.type === "evoaccess") || []

  // Get the username and UID based on profile type
  const getProfileData = () => {
    if (profileType === 'own') {
      return {
        username: freeFireProfile?.game_username || '',
        uid: freeFireProfile?.uid || freeFireProfile?.game_uid || ''
      }
    }
    return {
      username: customUsername.trim(),
      uid: customUid.trim()
    }
  }

  // Check if form is valid
  const isProfileValid = profileType === 'own' 
    ? (freeFireProfile?.game_username && (freeFireProfile?.uid || freeFireProfile?.game_uid))
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

  // Format membership name
  const getMembershipName = (membership) => {
    if (membership === 'weekly-light') return 'Wk Light'
    return membership.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Get selected item display title
  const getSelectedTitle = (item) => {
    if (item.type === 'diamond') return `${item.diamonds.toLocaleString()} Diamonds`
    if (item.type === 'membership') return `${getMembershipName(item.membership)} Membership`
    if (item.type === 'levelup') return `Level Up ${item.level}`
    if (item.type === 'evoaccess') return `Evo Access ${item.day}`
    return ''
  }

  // Get item type header label
  const getItemTypeHeader = (item) => {
    if (item.type === 'diamond') return 'DIAMONDS'
    if (item.type === 'membership') return 'MEMBERSHIP'
    if (item.type === 'levelup') return 'LEVEL UP PASS'
    if (item.type === 'evoaccess') return 'EVO ACCESS'
    return ''
  }

  // Black and white theme
  const themeColor = isLight ? '#000000' : '#ffffff'
  const selectedTextColor = isLight ? '#ffffff' : '#000000'
  const selectedSubTextColor = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'

  // Render diamond option button (Vertical Card - Similar to Membership)
  const renderDiamondOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.diamondCard,
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
          <View  style={styles.selectedMark}>
            <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.sm} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}
        
        {/* Diamond Icon */}
        <Image 
          source={item.image} 
          style={styles.diamondIconImg}
          resizeMode="contain"
        />
        
        {/* Diamond Count & Label */}
        <Text 
          style={[styles.modeLabel, { color: cardColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          DIAMONDS
        </Text>
        <Text
          style={[styles.diamondCount, {
            color: isSelected 
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#1a1a1a' : '#ffffff'),
          }]}
          numberOfLines={1}
        >
          {item.diamonds.toLocaleString()}
        </Text>
        
        {/* Points */}
        <View style={styles.diamondPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <PointsIcon size={iconSize.xs} color={isSelected && !isLight ? '#000000' : '#00bf63'} />
          <Text style={[styles.diamondPrice, {
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

  // Render membership card
  const renderMembershipOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.membershipOption,
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
        {isSelected && (
          <View  style={[styles.selectedCheck, {
            backgroundColor: isLight ? '#ffffff' : '#000000'
          }]}>
            <AppIcon icon={CheckIcon} size={iconSize.xs} color={themeColor} />
          </View>
        )}

        {/* Membership Image */}
        <Image
          source={item.image}
          style={styles.membershipImage}
          resizeMode="contain"
        />

        {/* Text */}
        <Text 
          style={[styles.modeLabel, { color: cardColor, marginTop: fontSize.xs }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          MEMBERSHIP
        </Text>
        <Text 
          style={[styles.membershipTitle, {
            color: isSelected 
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#000000' : '#ffffff')
          }]}
          numberOfLines={1}
        >
          {getMembershipName(item.membership)}
        </Text>

        {/* Points */}
        <View style={styles.membershipPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <PointsIcon size={iconSize.xs} color={isSelected && !isLight ? '#000000' : '#00bf63'} />
          <Text style={[styles.membershipPrice, {
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

  // Render single level up card with level selector
  const renderLevelUpSection = () => {
    const selectedLevel = selectedItem?.type === 'levelup' ? selectedItem : null
    const cardColor = isLight ? '#000000' : '#ffffff'

    return (
      <View style={[styles.levelUpCard, {
        borderRadius: 12,
        backgroundColor: isLight ? '#f5f5f5' : '#141414',
        borderColor: isLight ? '#e0e0e0' : '#2a2a2a',
      }]}>
        {/* Image */}
        <Image 
          source={levelups[0]?.image} 
          style={styles.levelUpImg} 
          resizeMode="contain" 
        />

        <Text 
          style={[styles.modeLabel, { color: cardColor, marginTop: fontSize.xs }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          LEVEL UP PASS
        </Text>
        <Text 
          style={[styles.levelUpTitle, { color: isLight ? '#1a1a1a' : '#ffffff' }]}
          numberOfLines={1}
        >
          Select a Level
        </Text>

        {/* Level Boxes */}
        <View style={styles.levelSelectorGrid}>
          {levelups.map((item) => {
            const isSelected = selectedItem?.id === item.id
            return (
              <Pressable
                key={item.id}
                style={[styles.levelChip, {
                  backgroundColor: isSelected
                    ? (isLight ? '#000000' : '#ffffff')
                    : 'transparent',
                  borderColor: isSelected
                    ? (isLight ? '#000000' : '#ffffff')
                    : (isLight ? '#000000' : '#ffffff'),
                }]}
                onPress={() => setSelectedItem(item)}
              >
                <Text style={[styles.levelChipText, {
                  color: isSelected
                    ? (isLight ? '#ffffff' : '#000000')
                    : (isLight ? '#000000' : '#ffffff'),
                }]}>
                  LvL Up {item.level}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Points */}
        {selectedLevel && (
          <View style={[styles.diamondPriceContainer, { marginTop: 10 }]}>
            <View style={[styles.priceLine, { backgroundColor: isLight ? '#cccccc' : '#444444' }]} />
            <PointsIcon size={iconSize.xs} color="#00bf63" />
            <Text style={[styles.diamondPrice, { color: '#00bf63' }]}>
              {selectedLevel.points} point
            </Text>
            <View style={[styles.priceLine, { backgroundColor: isLight ? '#cccccc' : '#444444' }]} />
          </View>
        )}
      </View>
    )
  }

  // Render evo access card (3-column row)
  const renderEvoOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')

    return (
      <Pressable
        key={item.id}
        style={[
          styles.evoCard,
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
        {isSelected && (
          <View  style={styles.selectedMark}>
            <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.sm} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}

        <Image source={item.image} style={styles.evaImg} resizeMode="contain" />

        <Text 
          style={[styles.modeLabel, { color: cardColor, marginTop: spacing.sm }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          EVO ACCESS
        </Text>
        <Text 
          style={[styles.diamondCount, {
            color: isSelected
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#1a1a1a' : '#ffffff'),
          }]}
          numberOfLines={1}
        >
          {item.day}
        </Text>

        <View style={styles.diamondPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <PointsIcon size={iconSize.xs} color={isSelected && !isLight ? '#000000' : '#00bf63'} />
          <Text style={[styles.diamondPrice, {
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
      storeKey="freefire"
      gameLogoUrl={game?.game_logo_url}
      title="FreeFire Store"
      isLight={isLight}
      isLoading={isLoadingStore || isSubmitting}
      onSubmit={handleConfirm}
      buttonTitle={isSubmitting ? "Processing..." : "Confirm Purchase"}
      loaderMessage={isSubmitting ? "Processing" : "Opening"}
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
                    {selectedItem.type === 'diamond' ? (
                      <Image 
                        source={selectedItem.image} 
                        style={styles.selectedItemIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image 
                        source={selectedItem.image} 
                        style={styles.selectedItemMembershipIcon}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.modeLabel, { color: ACCENT_PRIMARY(isLight) }]}>
                      YOUR SELECTION
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
      {/* Diamond Packages */}
      <View style={styles.section}>
        <SectionTitle title="Diamond Packages" isLight={isLight} />
        <View style={styles.optionsGrid}>
          {diamonds.map((item, index) => renderDiamondOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Membership Packages */}
      <View style={styles.section}>
        <SectionTitle title="Memberships" isLight={isLight} />
        <View style={styles.membershipGrid}>
          {memberships.map((item, index) => renderMembershipOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Level Up Pass */}
      <View style={styles.section}>
        <SectionTitle title="Level Up Packages" isLight={isLight} />
        {renderLevelUpSection()}
      </View>

      <DividerLine isLight={isLight} />

      {/* Evo Access */}
      <View style={styles.section}>
        <SectionTitle title="Evo Access" isLight={isLight} />
        <View style={styles.evoGrid}>
          {evoaccesses.map((item, index) => renderEvoOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />
      <View style={styles.section}>
        <SectionTitle title="Select Profile" isLight={isLight} />
        
        {/* Profile Type Toggle */}
        <View style={styles.profileToggleContainer}>
          <Pressable
            style={[
              styles.profileToggleOption,
              {
                backgroundColor: profileType === 'own'
                  ? (isLight ? '#000000' : '#ffffff')
                  : 'transparent',
                borderColor: profileType === 'own'
                  ? (isLight ? '#000000' : '#ffffff')
                  : (isLight ? '#cccccc' : '#333333'),
              }
            ]}
            onPress={() => setProfileType('own')}
          >
            <AppIcon icon={UserIcon} size={iconSize.sm} color={profileType === 'own' 
                ? (isLight ? '#ffffff' : '#000000')
                : (isLight ? '#666666' : '#999999')} />
            <Text style={[
              styles.profileToggleText,
              {
                color: profileType === 'own'
                  ? (isLight ? '#ffffff' : '#000000')
                  : (isLight ? '#333333' : '#ffffff')
              }
            ]}>
              Use My Profile
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.profileToggleOption,
              {
                backgroundColor: profileType === 'other'
                  ? (isLight ? '#000000' : '#ffffff')
                  : 'transparent',
                borderColor: profileType === 'other'
                  ? (isLight ? '#000000' : '#ffffff')
                  : (isLight ? '#cccccc' : '#333333'),
              }
            ]}
            onPress={() => setProfileType('other')}
          >
            <AppIcon icon={UserArrowLeftRightIcon} size={iconSize.sm} color={profileType === 'other' 
                ? (isLight ? '#ffffff' : '#000000')
                : (isLight ? '#666666' : '#999999')} />
            <Text style={[
              styles.profileToggleText,
              {
                color: profileType === 'other'
                  ? (isLight ? '#ffffff' : '#000000')
                  : (isLight ? '#333333' : '#ffffff')
              }
            ]}>
              Use Another Profile
            </Text>
          </Pressable>
        </View>

        {/* Profile Details */}
        {profileType === 'own' ? (
          <View style={[styles.profileBox, {
            backgroundColor: 'transparent',
            borderColor: isLight ? "#cccccc" : "#333333",
          }]}>
            <View style={styles.profileItem}>
              <AppIcon icon={UserIcon} size={iconSize.sm} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />
   
              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {freeFireProfile?.game_username || 'Not Set'}
              </Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: isLight ? '#cccccc' : '#333333' }]} />
            <View style={styles.profileItem}>
              <AppIcon icon={IdentityCardIcon} size={iconSize.sm} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />

              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {freeFireProfile?.uid || freeFireProfile?.game_uid || 'Not Set'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.customProfileContainer}>
            <View style={[styles.inputContainer, {
              borderColor: isLight ? '#cccccc' : '#333333',
              backgroundColor: isLight ? '#f8f8f8' : '#1a1a1a',
            }]}>
              <AppIcon icon={GameController03Icon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
              <TextInput
                style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder="Game Name"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={customUsername}
                onChangeText={setCustomUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={[styles.inputContainer, {
              borderColor: isLight ? '#cccccc' : '#333333',
              backgroundColor: isLight ? '#f8f8f8' : '#1a1a1a',
            }]}>
              <AppIcon icon={LabelIcon} size={iconSize.md} color={isLight ? '#666666' : '#999999'} />
              <TextInput
                style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder="UID"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={customUid}
                onChangeText={setCustomUid}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
      </View>

      {/* Terms Agreement */}
      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={() => setAgreementAccepted(!agreementAccepted)}
        isLight={isLight}
        text={profileType === 'own' 
          ? "My Game Name & UID are correct."
          : "Provided Game Name & UID are correct."}
      />
    </CreateGameLayout>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Vertical Diamond Card Styles (2 columns layout)
  diamondCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 14,
    // borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  cornerAccent: {},
  cornerTopLeft: {},
  cornerBottomRight: {},
  modeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
  },
  diamondIconImg: {
    width: 70,
    height: 70,
    marginBottom: spacing.sm,
  },
  diamondCount: {
    fontSize: spacing.xl,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  diamondPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  diamondPrice: {
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
  membershipGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  membershipOption: {
    flex: 1,
    // borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  membershipImage: {
    width: '100%',
    height: 100,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  membershipTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  membershipPrice: {
    fontSize: 11,
    fontWeight: '600',
  },
  membershipPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  profileBox: {
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 16,
    marginTop: 12,
  },
  profileItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  profileDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 12,
  },

  profileValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  profileToggleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  profileToggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  profileToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customProfileContainer: {
    gap: 10,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  selectedItemDisplay: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // borderWidth: 1,
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
  selectedItemMembershipIcon: {
    width: 64,
    height: 44,
  },
  selectedItemLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
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
    // borderWidth: 1,
  },
  selectedItemPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00bf63',
  },
  levelUpCard: {
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    paddingTop: 100,
  },
  levelUpImg: {
    width: 180,
    height: 180,
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
  },
  levelUpTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  levelSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  levelChip: {
    flexBasis: '31%',
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 10,
    borderWidth: 1.5,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  levelCheckMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  evoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  evoCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  evaImg: {
    width: '100%',
    height: 90,
  },
})

export default FreeFireStore
