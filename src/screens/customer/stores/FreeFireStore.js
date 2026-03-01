import { View, Text, StyleSheet, Image, Pressable } from 'react-native'
import { useThemeStore } from '../../../store/themeStore'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useState, useRef } from 'react'
import { useGameProfiles } from '../../../queries/useGameProfiles'
import { CreateGameLayout, SectionTitle, DividerLine, TermsAgreement } from '../../../component/customer/createGame'

// Local images
const weeklyMembershipImg = require('../../../assets/weekly.png')
const monthlyMembershipImg = require('../../../assets/monthly.png')
const diamondImg = require('../../../assets/diamond.png')

const FreeFireStore = ({ route }) => {
  const { game } = route.params || {}
  const { isLight } = useThemeStore()
  const { data: gameProfiles = [] } = useGameProfiles()
  const termsRef = useRef(null)

  // Selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  // Get player's Free Fire profile from game profiles
  const freeFireProfile = gameProfiles.find(
    profile => profile.game_name?.toLowerCase() === 'free fire'
  )

  useEffect(() => {
   console.log('Game data in FreeFireStore:', game)
   console.log('Game Profiles:', gameProfiles)
   console.log('Free Fire Profile:', freeFireProfile)
  }, [game, gameProfiles, freeFireProfile])
  

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

  // Check if form is valid
  const isFormValid = selectedItem && agreementAccepted

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

    console.log('Selected Item:', {
      type: selectedItem.type,
      [selectedItem.type === 'diamond' ? 'diamonds' : 'membership']: 
        selectedItem.type === 'diamond' ? selectedItem.diamonds : selectedItem.membership,
      points: selectedItem.points
    })
  }

  // Garena red theme for light mode
  const themeColor = isLight ? '#d81b0d' : '#ffffff'
  const selectedTextColor = isLight ? '#ffffff' : '#000000'
  const selectedSubTextColor = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'

  // Render diamond option button (Vertical Card - Similar to Membership)
  const renderDiamondOption = (item) => {
    const isSelected = selectedItem?.id === item.id
    const accentColor = isLight ? '#d81b0d' : '#ffffff'
    
    return (
      <Pressable
        key={item.id}
        style={[
          styles.diamondCard,
          {
            backgroundColor: isSelected 
              ? (isLight ? '#d81b0d' : '#ffffff')
              : 'transparent',
            borderColor: isSelected 
              ? (isLight ? '#d81b0d' : '#ffffff')
              : (isLight ? '#cccccc' : '#333333'),
          },
        ]}
        onPress={() => setSelectedItem(item)}
      >
        {/* Selection checkmark */}
        {isSelected && (
          <View style={styles.selectedMark}>
            <MaterialIcons name="check-circle" size={20} color={isLight ? '#ffffff' : '#000000'} />
          </View>
        )}
        
        {/* Diamond Image */}
        <View style={[styles.diamondImageContainer, {
          backgroundColor: isSelected 
            ? (isLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)')
            : (isLight ? '#f8f8f8' : '#1c1c1c'),
        }]}>
          <Image 
            source={diamondImg} 
            style={styles.diamondIconImg}
            resizeMode="contain"
          />
        </View>
        
        {/* Diamond Count & Label */}
        <Text
          style={[
            styles.diamondCount,
            {
              color: isSelected 
                ? (isLight ? '#ffffff' : '#000000')
                : (isLight ? '#1a1a1a' : '#ffffff'),
            },
          ]}
        >
          {item.diamonds.toLocaleString()}
        </Text>
        <Text style={[styles.diamondLabel, {
          color: isSelected 
            ? (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)')
            : (isLight ? '#888888' : '#666666')
        }]}>
          Diamonds
        </Text>
        
        {/* Points */}
        <View style={styles.diamondPriceContainer}>
          <MaterialCommunityIcons 
            name="star-four-points-outline" 
            size={14} 
            color={isSelected && !isLight ? '#000000' : '#00bf63'} 
          />
          <Text style={[styles.diamondPrice, {
            color: isSelected 
              ? (isLight ? '#00bf63' : '#000000')
              : (isLight ? '#00bf63' : '#ffffff')
          }]}>
            {item.points} Points
          </Text>
        </View>
      </Pressable>
    )
  }

  // Render membership card
  const renderMembershipOption = (item) => {
    const isSelected = selectedItem?.id === item.id
    
    return (
      <Pressable
        key={item.id}
        style={[styles.membershipOption, {
          backgroundColor: isSelected 
            ? themeColor 
            : 'transparent',
          borderColor: isSelected 
            ? themeColor 
            : (isLight ? "#cccccc" : "#333333"),
        }]}
        onPress={() => setSelectedItem(item)}
      >
        {isSelected && (
          <View style={[styles.selectedCheck, {
            backgroundColor: isLight ? '#ffffff' : '#000000'
          }]}>
            <MaterialIcons name="check" size={14} color={themeColor} />
          </View>
        )}
        <Image
          source={item.image}
          style={styles.membershipImage}
          resizeMode="contain"
        />
        <View style={styles.membershipTextContainer}>
          <Text style={[styles.membershipTitle, {
            color: isSelected 
              ? selectedTextColor 
              : (isLight ? "#000000" : "#ffffff")
          }]}>
            {item.membership.charAt(0).toUpperCase() + item.membership.slice(1)} Membership
          </Text>
          <Pressable style={styles.infoButton}>
            <MaterialIcons 
              name="info-outline" 
              size={16} 
              color={isSelected 
                ? selectedSubTextColor 
                : (isLight ? "#00bf63" : "#666666")} 
            />
          </Pressable>
        </View>
        <View style={styles.membershipPriceContainer}>
          <MaterialCommunityIcons 
            name="star-four-points-outline" 
            size={14} 
            color={isSelected && !isLight ? '#000000' : '#00bf63'} 
          />
          <Text style={[styles.membershipPrice, {
            color: isSelected 
              ? (isLight ? '#00bf63' : '#000000')
              : (isLight ? '#00bf63' : '#ffffff')
          }]}>
            {item.points} Points
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
      buttonBackgroundColor={isLight ? '#d81b0d' : undefined}
      buttonTextColor={isLight ? '#ffffff' : undefined}
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
              100% Secure
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>•</Text>
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Fast
            </Text>
            <Text style={[styles.separator, { color: isLight ? '#cccccc' : '#555555' }]}>•</Text>
            <Text style={[styles.securityText, { color: isLight ? '#666666' : '#999999' }]}>
              Cheapest
            </Text>
          </View>
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Diamond Packages */}
      <View style={styles.section}>
        <SectionTitle title="Diamond Packages" isLight={isLight} />
        <View style={styles.optionsGrid}>
          {diamonds.map(renderDiamondOption)}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Membership Packages */}
      <View style={styles.section}>
        <SectionTitle title="Membership" isLight={isLight} />
        <View style={styles.membershipGrid}>
          {memberships.map(renderMembershipOption)}
        </View>
      </View>

      <DividerLine isLight={isLight} />

      {/* Player Profile */}
      <View style={styles.section}>
        <SectionTitle title="Your Game Profile" isLight={isLight} />
        <View style={[styles.profileBox, {
          backgroundColor: 'transparent',
          borderColor: isLight ? "#cccccc" : "#333333",
        }]}>
          <View style={styles.profileItem}>
            <Text style={[styles.profileLabel, { color: isLight ? '#666666' : '#999999' }]}>
              Username
            </Text>
            <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
              {freeFireProfile?.game_username || 'Not Set'}
            </Text>
          </View>
          <View style={[styles.profileDivider, { backgroundColor: isLight ? '#cccccc' : '#333333' }]} />
          <View style={styles.profileItem}>
            <Text style={[styles.profileLabel, { color: isLight ? '#666666' : '#999999' }]}>
              UID
            </Text>
            <Text style={[styles.profileValue, { color: isLight ? '#000000' : '#ffffff' }]}>
              {freeFireProfile?.uid || freeFireProfile?.game_uid || 'Not Set'}
            </Text>
          </View>
        </View>
      </View>

      {/* Terms Agreement */}
      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={() => setAgreementAccepted(!agreementAccepted)}
        isLight={isLight}
        text="Yes, my username and uid are correct."
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
    padding: 12,
    borderRadius: 6,
    // borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  gameLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
  // Vertical Diamond Card Styles (Similar to Membership)
  diamondCard: {
    flexBasis: '31%',
    flexGrow: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  diamondImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  diamondIconImg: {
    width: 34,
    height: 34,
  },
  diamondCount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  diamondLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  membershipImage: {
    width: '100%',
    height: 100,
    marginBottom: 10,
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
  membershipTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membershipTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  membershipPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  membershipPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  infoButton: {
    padding: 2,
  },
  profileBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
})

export default FreeFireStore
