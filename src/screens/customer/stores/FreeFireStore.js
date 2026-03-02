import { View, Text, StyleSheet, Image, Pressable, TextInput, Animated } from 'react-native'
import { useThemeStore } from '../../../store/themeStore'
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { useEffect, useState, useRef } from 'react'
import { useGameProfiles } from '../../../queries/useGameProfiles'
import { CreateGameLayout, SectionTitle, DividerLine, TermsAgreement } from '../../../component/customer/createGame'

// Local images
const weeklyMembershipImg = require('../../../assets/weekly.png')
const monthlyMembershipImg = require('../../../assets/monthly.png')
const diamondImg = require('../../../assets/diamond.png')

// Monochrome accent colors
const ACCENT_PRIMARY = (isLight) => isLight ? '#000000' : '#ffffff'
const ACCENT_ALT = (isLight) => isLight ? '#555555' : '#aaaaaa'

const FreeFireStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const { data: gameProfiles = [] } = useGameProfiles()
  const termsRef = useRef(null)
  const slideAnim = useRef(new Animated.Value(0)).current

  // Selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  
  // Profile selection state
  const [profileType, setProfileType] = useState('own') // 'own' or 'other'
  const [customUsername, setCustomUsername] = useState('')
  const [customUid, setCustomUid] = useState('')

  // Get player's Free Fire profile from game profiles
  const freeFireProfile = gameProfiles.find(
    profile => profile.game_name?.toLowerCase() === 'free fire'
  )

  useEffect(() => {
   console.log('Game data in FreeFireStore:', game)
   console.log('Game Profiles:', gameProfiles)
   console.log('Free Fire Profile:', freeFireProfile)
  }, [game, gameProfiles, freeFireProfile])

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
  

  // Store items with game points pricing (diamonds + memberships)
  const storeItems = [
    { id: 1, type: "diamond", diamonds: 25, points: 30, image: null },
    { id: 2, type: "diamond", diamonds: 100, points: 110, image: null },
    { id: 3, type: "diamond", diamonds: 310, points: 350, image: null },
    { id: 4, type: "diamond", diamonds: 520, points: 580, image: null },
    { id: 5, type: "diamond", diamonds: 1060, points: 1180, image: null },
    { id: 6, type: "diamond", diamonds: 2180, points: 2400, image: null },
    { id: 7, type: "diamond", diamonds: 5600, points: 6100, image: null },
    { id: 8, type: "diamond", diamonds: 11500, points: 12500, image: null },
    { id: 9, type: "membership", membership: "weekly", points: 150, image: weeklyMembershipImg },
    { id: 10, type: "membership", membership: "monthly", points: 350, image: monthlyMembershipImg },
  ]

  // Separate diamonds and memberships
  const diamonds = storeItems.filter(item => item.type === "diamond")
  const memberships = storeItems.filter(item => item.type === "membership")

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
  const handleConfirm = () => {
    if (!selectedItem) {
      console.log('Please select an item')
      return
    }

    if (!agreementAccepted) {
      termsRef.current?.shake()
      return
    }

    const profileData = getProfileData()
    if (!profileData.username || !profileData.uid) {
      console.log('Please provide valid username and UID')
      return
    }

    const payload = {
      type: selectedItem.type,
      [selectedItem.type === 'diamond' ? 'diamonds' : 'membership']: 
        selectedItem.type === 'diamond' ? selectedItem.diamonds : selectedItem.membership,
      points: selectedItem.points,
      username: profileData.username,
      uid: profileData.uid
    }

    console.log('Selected Item:', payload)
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
        {/* Corner Accents */}
        <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: cardColor }]} />
        <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: accentAlt }]} />

        {/* Selection checkmark */}
        {isSelected && (
          <View style={styles.selectedMark}>
            <MaterialIcons name="check-circle" size={18} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}
        
        {/* Diamond Icon Wrapper */}
        <View style={[styles.diamondImageContainer, {
          backgroundColor: isSelected 
            ? (isLight ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
            : (isLight ? '#f8f8f8' : '#1f1f1f'),
          borderColor: isSelected
            ? (isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
            : (isLight ? '#eeeeee' : '#2a2a2a'),
        }]}>
          <Image 
            source={diamondImg} 
            style={styles.diamondIconImg}
            resizeMode="contain"
          />
        </View>
        
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
        {/* Corner Accents */}
        <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: cardColor }]} />
        <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: accentAlt }]} />

        {isSelected && (
          <View style={[styles.selectedCheck, {
            backgroundColor: isLight ? '#ffffff' : '#000000'
          }]}>
            <MaterialIcons name="check" size={12} color={themeColor} />
          </View>
        )}

        {/* Membership Image */}
        <View style={[styles.membershipImgWrapper, {
          backgroundColor: isSelected
            ? (isLight ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
            : (isLight ? '#f8f8f8' : '#1f1f1f'),
          borderColor: isSelected
            ? (isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
            : (isLight ? '#eeeeee' : '#2a2a2a'),
        }]}>
          <Image
            source={item.image}
            style={styles.membershipImage}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <Text style={[styles.modeLabel, { color: cardColor, marginTop: 10 }]}>MEMBERSHIP</Text>
        <Text style={[styles.membershipTitle, {
          color: isSelected 
            ? (isLight ? '#ffffff' : '#000000')
            : (isLight ? '#000000' : '#ffffff')
        }]}>
          {item.membership.charAt(0).toUpperCase() + item.membership.slice(1)}
        </Text>

        {/* Points */}
        <View style={styles.membershipPriceContainer}>
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
        </View>
      </Pressable>
    )
  }

  return (
    <CreateGameLayout
      title="FreeFire Store"
      isLight={isLight}
      isLoading={false}
      onSubmit={handleConfirm}
      buttonTitle="Confirm Purchase"
      loaderMessage="Processing..."
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
              elevation: 4,
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
            {/* Corner Accents */}
            <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
            <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
            <View style={styles.selectedItemRow}>
              <View style={styles.selectedItemLeft}>
                <View style={[styles.selectedItemIconWrapper, {
                  backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
                }]}>
                  {selectedItem.type === 'diamond' ? (
                    <Image 
                      source={diamondImg} 
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
                    {selectedItem.type === 'diamond' 
                      ? `${selectedItem.diamonds.toLocaleString()} Diamonds`
                      : `${selectedItem.membership.charAt(0).toUpperCase() + selectedItem.membership.slice(1)} Membership`
                    }
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
        {/* <SectionTitle title="Diamond Packages" isLight={isLight} /> */}
        <View style={styles.optionsGrid}>
          {diamonds.map((item, index) => renderDiamondOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Membership Packages */}
      <View style={styles.section}>
        {/* <SectionTitle title="Membership" isLight={isLight} /> */}
        <View style={styles.membershipGrid}>
          {memberships.map((item, index) => renderMembershipOption(item, index))}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Player Profile */}
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
            <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
            <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
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
              My Profile
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
            <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
            <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
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
              Another Profile
            </Text>
          </Pressable>
        </View>

        {/* Profile Details */}
        {profileType === 'own' ? (
          <View style={[styles.profileBox, {
            backgroundColor: 'transparent',
            borderColor: isLight ? "#cccccc" : "#333333",
          }]}>
            <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
            <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
            <View style={styles.profileItem}>
              <MaterialCommunityIcons name="account-outline" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />
              <Text style={[styles.profileLabel, { color: isLight ? '#666666' : '#999999' }]}>
                Game Name
              </Text>
              <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
                {freeFireProfile?.game_username || 'Not Set'}
              </Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: isLight ? '#cccccc' : '#333333' }]} />
            <View style={styles.profileItem}>
              <MaterialCommunityIcons name="identifier" size={18} color={isLight ? '#888888' : '#777777'} style={{ marginBottom: 4 }} />
              <Text style={[styles.profileLabel, { color: isLight ? '#666666' : '#999999' }]}>
                UID
              </Text>
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
              <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
              <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
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
              <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: ACCENT_PRIMARY(isLight) }]} />
              <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: ACCENT_ALT(isLight) }]} />
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
  cornerAccent: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderWidth: 2,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  modeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  diamondImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  diamondIconImg: {
    width: 30,
    height: 30,
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
  membershipImgWrapper: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  membershipImage: {
    width: '80%',
    height: '80%',
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
  profileLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
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
})

export default FreeFireStore
