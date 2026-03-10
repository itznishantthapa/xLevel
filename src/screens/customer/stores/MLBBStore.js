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
import { scaleWidth, scaleHeight } from '../../../utils/scaling'

// Monochrome accent colors
const ACCENT_PRIMARY = (isLight) => isLight ? '#000000' : '#ffffff'
const ACCENT_ALT = (isLight) => isLight ? '#555555' : '#aaaaaa'

const MLBBStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const { data: gameProfiles = [] } = useGameProfiles()
  const { get_user } = useAuthStore()
  const queryClient = useQueryClient()
  const { mutateAsync: storeTopup } = useStoreTopup()
  const termsRef = useRef(null)
  const slideAnim = useRef(new Animated.Value(0)).current

  // Fetch store items for MLBB
  const { data: storeItemsData, isLoading: isLoadingStore } = useStoreItems('mlbb')

  // Selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Profile selection state
  const [profileType, setProfileType] = useState('own') // 'own' or 'other'
  const [customUid, setCustomUid] = useState('')
  const [customZoneId, setCustomZoneId] = useState('')

  // Get player's MLBB profile from game profiles
  const mlbbProfile = gameProfiles.find(
    profile => profile.game_name?.toLowerCase() === 'mlbb'
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

      // Add type-specific fields
      if (item.type === 'diamond') {
        transformed.diamonds = item.quantity
      } else if (item.type === 'pass') {
        transformed.pass = item.label
      }

      return transformed
    })
  }

  // Store items from API
  const storeItems = transformStoreItems(storeItemsData)

  // Separate item types
  const diamonds = storeItems?.filter(item => item.type === "diamond") || []
  const passes = storeItems?.filter(item => item.type === "pass") || []

  // Get the UID and Zone ID based on profile type
  const getProfileData = () => {
    if (profileType === 'own') {
      return {
        uid: mlbbProfile?.uid || mlbbProfile?.game_uid || '',
        zone_id: mlbbProfile?.server_id || ''
      }
    }
    return {
      uid: customUid.trim(),
      zone_id: customZoneId.trim()
    }
  }

  // Check if form is valid
  const isProfileValid = profileType === 'own' 
    ? ((mlbbProfile?.uid || mlbbProfile?.game_uid) && mlbbProfile?.server_id)
    : (customUid.trim() && customZoneId.trim())
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
    if (!profileData.uid || !profileData.zone_id) {
      Toast.show('Please provide valid UID and Zone ID', Toast.SHORT)
      return
    }

    // Prepare payload for backend
    const payload = {
      product_id: selectedItem.id,
      uid: profileData.uid,
      zone_id: profileData.zone_id
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
    if (item.type === 'diamond') return `${item.diamonds.toLocaleString()} Diamonds`
    if (item.type === 'pass') return item.pass
    return ''
  }

  // Black and white theme
  const themeColor = isLight ? '#000000' : '#ffffff'
  const selectedTextColor = isLight ? '#ffffff' : '#000000'
  const selectedSubTextColor = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'

  // Render Diamond option button (Vertical Card)
  const renderDiamondOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')
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
          <View style={styles.selectedMark}>
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

  // Render Pass option button (Horizontal Card)
  const renderPassOption = (item, index) => {
    const isSelected = selectedItem?.id === item.id
    const cardColor = isSelected
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#000000' : '#ffffff')
    const accentAlt = ACCENT_ALT(isLight)
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.passCard,
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
          <View style={[styles.selectedCheck, {
            backgroundColor: isLight ? '#ffffff' : '#000000'
          }]}>
            <MaterialIcons name="check" size={12} color={themeColor} />
          </View>
        )}

        {/* Pass Image */}
        <Image
          source={item.image}
          style={styles.passImage}
          resizeMode="contain"
        />

        {/* Text */}
        <Text 
          style={[styles.modeLabel, { color: cardColor, marginTop: scaleHeight(10) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          PASS
        </Text>
        <Text style={[styles.passTitle, {
          color: isSelected 
            ? (isLight ? '#ffffff' : '#000000')
            : (isLight ? '#000000' : '#ffffff')
        }]}>
          {item.pass}
        </Text>

        {/* Points */}
        <View style={styles.passPriceContainer}>
          <View style={[styles.priceLine, { backgroundColor: isSelected ? (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)') : (isLight ? '#cccccc' : '#444444') }]} />
          <MaterialCommunityIcons 
            name="star-four-points-outline" 
            size={12} 
            color={isSelected && !isLight ? '#000000' : '#00bf63'} 
          />
          <Text style={[styles.passPrice, {
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
      title="MLBB Store"
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
                      style={styles.selectedItemPassIcon}
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
            {game?.game_name || 'Mobile Legends: Bang Bang'}
          </Text>
          <View style={styles.securityBadge}>
            <MaterialIcons name="verified-user" size={12} color={'#00bf63'} />
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              100% Secure
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

      {/* Diamonds Section */}
      {diamonds.length > 0 && (
        <>
          <View style={styles.section}>
            <SectionTitle title="Diamonds" isLight={isLight} />
            <View style={styles.optionsGrid}>
              {diamonds.map((item, index) => renderDiamondOption(item, index))}
            </View>
          </View>
          <DividerLine isLight={isLight} />
        </>
      )}

      {/* Passes Section */}
      {passes.length > 0 && (
        <>
          <View style={styles.section}>
            <SectionTitle title="Passes" isLight={isLight} />
            <View style={styles.passGrid}>
              {passes.map((item, index) => renderPassOption(item, index))}
            </View>
          </View>
          <DividerLine isLight={isLight} />
        </>
      )}

      {/* Profile Selection */}
      <View style={styles.section}>
        <SectionTitle title="Select Profile" isLight={isLight} />
        
        {/* Profile Type Switcher */}
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

        {/* Profile Display/Input */}
        {profileType === 'own' ? (
          <View style={[styles.profileBox, {
            backgroundColor: 'transparent',
            borderColor: isLight ? "#cccccc" : "#333333",
          }]}>
            <View style={styles.profileItem}>
              <MaterialCommunityIcons name="identifier" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />
   
              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {mlbbProfile?.uid || mlbbProfile?.game_uid || 'Not Set'}
              </Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: isLight ? '#cccccc' : '#333333' }]} />
            <View style={styles.profileItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />

              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {mlbbProfile?.server_id || 'Not Set'}
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
                name="identifier" 
                size={20} 
                color={isLight ? '#666666' : '#999999'} 
              />
              <TextInput
                style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder="Player UID"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={customUid}
                onChangeText={setCustomUid}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputContainer, {
              borderColor: isLight ? '#cccccc' : '#333333',
              backgroundColor: isLight ? '#f8f8f8' : '#1a1a1a',
            }]}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={20} 
                color={isLight ? '#666666' : '#999999'} 
              />
              <TextInput
                style={[styles.textInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder="Zone ID"
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={customZoneId}
                onChangeText={setCustomZoneId}
                keyboardType="numeric"
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
          ? "My UID & Zone ID are correct."
          : "Provided UID & Zone ID are correct."}
      />
    </CreateGameLayout>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: scaleHeight(8),
  },
  gameHeader: {
    flexDirection: 'row',
    padding: scaleWidth(14),
    alignItems: 'center',
    gap: scaleWidth(14),
    marginBottom: scaleHeight(4),
  },
  gameLogo: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(12),
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: scaleWidth(15),
    fontWeight: '600',
    marginBottom: scaleHeight(4),
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  securityText: {
    fontSize: scaleWidth(11),
    fontWeight: '500',
  },
  separator: {
    fontSize: scaleWidth(10),
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(10),
  },
  // Vertical Diamond Card Styles (2 columns layout)
  diamondCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: scaleWidth(14),
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedMark: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    zIndex: 1,
  },
  modeLabel: {
    fontSize: scaleWidth(9),
    fontWeight: '700',
    letterSpacing: scaleWidth(2),
    textTransform: 'uppercase',
    marginBottom: scaleHeight(2),
  },
  diamondIconImg: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    marginBottom: scaleHeight(8),
  },
  diamondCount: {
    fontSize: scaleWidth(20),
    fontWeight: '700',
    letterSpacing: scaleWidth(0.5),
    textAlign: 'center',
  },
  diamondPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    marginTop: scaleHeight(8),
  },
  diamondPrice: {
    fontSize: scaleWidth(11),
    fontWeight: '600',
  },
  priceLine: {
    width: scaleWidth(14),
    height: 1,
    opacity: 0.8,
  },
  passGrid: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  passCard: {
    flex: 1,
    borderWidth: 1,
    padding: scaleWidth(14),
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  passImage: {
    width: '100%',
    height: scaleWidth(100),
  },
  selectedCheck: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(11),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  passTitle: {
    fontSize: scaleWidth(15),
    fontWeight: '700',
    letterSpacing: scaleWidth(0.3),
  },
  passPrice: {
    fontSize: scaleWidth(11),
    fontWeight: '600',
  },
  passPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    marginTop: scaleHeight(6),
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
  selectedItemPassIcon: {
    width: 34,
    height: 34,
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
})

export default MLBBStore
