import { View, Text, StyleSheet, Image, Pressable, TextInput, Animated } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
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

  // Log store items when fetched
  useEffect(() => {
    if (storeItemsData) {
      console.log('FreeFire Store Items:', storeItemsData)
      console.log('Transformed Store Items:', transformStoreItems(storeItemsData))
    }
  }, [storeItemsData])

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
    if (item.type === 'levelup') return `Level Up to ${item.level}`
    if (item.type === 'evoaccess') return `Evo Access ${item.day}`
    return ''
  }

  // Black and white theme
  const themeColor = isLight ? '#000000' : '#ffffff'
  const selectedTextColor = isLight ? '#ffffff' : '#000000'
  const selectedSubTextColor = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'

  // Render diamond option button (Vertical Card - Similar to Membership)
  const renderDiamondOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = ACCENT_PRIMARY(isLight)
    const accentAlt = ACCENT_ALT(isLight)
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.diamondCard,
          {
            backgroundColor: isSelected 
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#ffffff' : '#141414'),
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
            <MaterialIcons name="check-circle" size={18} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}
        
        {/* Diamond Icon */}
        <Image 
          source={item.image} 
          style={styles.diamondIconImg}
          resizeMode="contain"
        />
        
        {/* Diamond Count & Label */}
        <Text style={[styles.modeLabel, { color: cardColor }]}>DIAMONDS</Text>
        <Text
          style={[styles.diamondCount, {
            color: isSelected 
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#1a1a1a' : '#ffffff'),
          }]}
        >
          {item.diamonds.toLocaleString()}
        </Text>
        
        {/* Points */}
        <View style={styles.diamondPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <MaterialCommunityIcons 
            name="star-four-points-outline" 
            size={12} 
            color={isSelected && !isLight ? '#000000' : '#00bf63'} 
          />
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
    const cardColor = ACCENT_PRIMARY(isLight)
    const accentAlt = ACCENT_ALT(isLight)
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.membershipOption,
          {
            backgroundColor: isSelected 
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#ffffff' : '#141414'),
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
            <MaterialIcons name="check" size={12} color={themeColor} />
          </View>
        )}

        {/* Membership Image */}
        <Image
          source={item.image}
          style={styles.membershipImage}
          resizeMode="contain"
        />

        {/* Text */}
        <Text style={[styles.modeLabel, { color: cardColor, marginTop: 10 }]}>MEMBERSHIP</Text>
        <Text style={[styles.membershipTitle, {
          color: isSelected 
            ? (isLight ? '#ffffff' : '#000000')
            : (isLight ? '#000000' : '#ffffff')
        }]}>
          {getMembershipName(item.membership)}
        </Text>

        {/* Points */}
        <View style={styles.membershipPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <MaterialCommunityIcons 
            name="star-four-points-outline" 
            size={12} 
            color={isSelected && !isLight ? '#000000' : '#00bf63'} 
          />
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
    const cardColor = ACCENT_PRIMARY(isLight)
    const accentAlt = ACCENT_ALT(isLight)

    return (
      <View style={[styles.levelUpCard, {
        backgroundColor: isLight ? '#ffffff' : '#141414',
        borderColor: isLight ? '#e0e0e0' : '#2a2a2a',
      }]}>
        {/* Image */}
        <Image 
          source={levelups[0]?.image} 
          style={styles.levelUpImg} 
          resizeMode="contain" 
        />

        <Text style={[styles.modeLabel, { color: cardColor, marginTop: 10 }]}>LEVEL UP PASS</Text>
        <Text style={[styles.levelUpTitle, { color: isLight ? '#1a1a1a' : '#ffffff' }]}>
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
                    : (isLight ? '#cccccc' : '#444444'),
                }]}
                onPress={() => setSelectedItem(item)}
              >
                <Text style={[styles.levelChipText, {
                  color: isSelected
                    ? (isLight ? '#ffffff' : '#000000')
                    : (isLight ? '#000000' : '#ffffff'),
                }]}>
                  Upto Lv. {item.level}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Points */}
        {selectedLevel && (
          <View style={[styles.diamondPriceContainer, { marginTop: 10 }]}>
            <View style={[styles.priceLine, { backgroundColor: isLight ? '#cccccc' : '#444444' }]} />
            <MaterialCommunityIcons name="star-four-points-outline" size={12} color="#00bf63" />
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
    const cardColor = ACCENT_PRIMARY(isLight)
    const accentAlt = ACCENT_ALT(isLight)

    return (
      <Pressable
        key={item.id}
        style={[
          styles.evoCard,
          {
            backgroundColor: isSelected
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#ffffff' : '#141414'),
            borderColor: isSelected
              ? (isLight ? '#000000' : '#ffffff')
              : (isLight ? '#e0e0e0' : '#2a2a2a'),
          },
        ]}
        onPress={() => setSelectedItem(item)}
      >
        {isSelected && (
          <View  style={styles.selectedMark}>
            <MaterialIcons name="check-circle" size={18} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}

        <Image source={item.image} style={styles.evaImg} resizeMode="contain" />

        <Text style={[styles.modeLabel, { color: cardColor, marginTop: 8 }]}>EVO ACCESS</Text>
        <Text style={[styles.diamondCount, {
          color: isSelected
            ? (isLight ? '#ffffff' : '#000000')
            : (isLight ? '#1a1a1a' : '#ffffff'),
        }]}>
          {item.day}
        </Text>

        <View style={styles.diamondPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={12}
            color={isSelected && !isLight ? '#000000' : '#00bf63'}
          />
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
              backgroundColor: isLight ? '#ffffff' : '#111111',
              borderColor: isLight ? '#e0e0e0' : '#333333',
              shadowColor: isLight ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: isLight ? 0.08 : 0.3,
              shadowRadius: 8,
              elevation: 20,
              overflow: 'hidden',
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
            <View style={styles.selectedItemRow}>
              <View style={styles.selectedItemLeft}>
                <View style={[styles.selectedItemIconWrapper, {
                  backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
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
                    YOUR TOP-UP
                  </Text>
                  <Text style={[styles.selectedItemTitle, { color: isLight ? '#000000' : '#ffffff' }]}>
                    {getSelectedTitle(selectedItem)}
                  </Text>
                </View>
              </View>
              <View style={[styles.selectedItemRight, {
                backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 191, 99, 0.1)',
                borderColor: isLight ? '#dcfce7' : 'rgba(0, 191, 99, 0.2)',
              }]}>
                <MaterialCommunityIcons 
                  name="star-four-points" 
                  size={14} 
                  color="#00bf63" 
                />
                <Text style={styles.selectedItemPoints}>
                  {selectedItem.points}
                </Text>
              </View>
            </View>
          </Animated.View>
        )
      }
    >
      {/* Game Info Header */}
      <View style={[styles.gameHeader, { 
        backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
        borderColor: isLight ? "#cccccc" : "#333333",
      }]}>
        <Image source={{ uri: game?.game_logo_url }} style={styles.gameLogo} />
        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, { color: isLight ? '#000000' : '#ffffff' }]}>
            {game?.game_name || 'Free Fire'}
          </Text>
          <View style={styles.securityBadge}>
            <MaterialIcons name="verified-user" size={12} color={'#00bf63'} />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              100%  Secure
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <MaterialIcons name="bolt" size={12} color={'#F97316'} />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Fast
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <MaterialIcons name="shield" size={12} color={'#6366F1'} />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Reliable
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>|</Text>
            <MaterialIcons name="touch-app" size={12} color={'#14B8A6'} />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Easy
            </Text>
          </View>
        </View>
      </View>

      <DividerLine isLight={isLight} />

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
            <MaterialCommunityIcons 
              name="account" 
              size={18} 
              color={profileType === 'own' 
                ? (isLight ? '#ffffff' : '#000000')
                : (isLight ? '#666666' : '#999999')} 
            />
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
            <MaterialCommunityIcons 
              name="account-switch-outline" 
              size={18} 
              color={profileType === 'other' 
                ? (isLight ? '#ffffff' : '#000000')
                : (isLight ? '#666666' : '#999999')} 
            />
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
              <MaterialCommunityIcons name="account-outline" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />
   
              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {freeFireProfile?.game_username || 'Not Set'}
              </Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: isLight ? '#cccccc' : '#333333' }]} />
            <View style={styles.profileItem}>
              <MaterialCommunityIcons name="identifier" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />

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
              <MaterialCommunityIcons 
                name="gamepad" 
                size={20} 
                color={isLight ? '#666666' : '#999999'} 
              />
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
              <MaterialIcons 
                name="tag" 
                size={20} 
                color={isLight ? '#666666' : '#999999'} 
              />
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
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerAccent: {},
  cornerTopLeft: {},
  cornerBottomRight: {},
  modeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  diamondIconImg: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  diamondCount: {
    fontSize: 20,
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
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
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
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileItem: {
    flex: 1,
    alignItems: 'center',
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
  },
  profileToggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  profileToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customProfileContainer: {
    gap: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
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
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
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
    width: 34,
    height: 24,
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
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedItemPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00bf63',
  },
  levelUpCard: {
    borderWidth: 1,
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
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  evaImg: {
    width: '100%',
    height: 90,
  },
})

export default FreeFireStore
