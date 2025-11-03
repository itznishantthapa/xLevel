"use client"

import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo, useEffect, useState } from "react"
import { Octicons, Entypo, MaterialIcons, Fontisto, MaterialCommunityIcons, Ionicons, FontAwesome6 } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useSocials } from "../../queries/useSocials"
import { useAuthStore } from "../../store/authStore"
import { useUtils } from "../../queries/useUtils"
import { scaleWidth, scaleHeight } from "../../utils/scaling"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from "react-native-reanimated"

const Header = ({
  player_name,
  wallet_balance,
  profile_picture,
  handleProfile,
  handleMessenger,
  handleInstagram,
  handleWhatsapp,
  handleHeaderGamePoint
}) => {
  const { data: socials = [] } = useSocials()
  const { data: utils = {} } = useUtils()

  // Build phrases from Utils API (fallback to default text)
  const phrases = useMemo(() => {
    const list = utils?.phrases?.map(p => p?.text).filter(Boolean) || []
    return list.length ? list : ["Get ready for the battle."]
  }, [utils])

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const flipAnimation = useSharedValue(0) // degrees: 0 -> 90 -> 0

  // Reset when phrases change
  useEffect(() => {
    setCurrentPhraseIndex(0)
    flipAnimation.value = 0
  }, [phrases.length])

  // Update phrase index from UI thread
  const updatePhraseIndex = () => {
    setCurrentPhraseIndex(prev => (prev + 1) % phrases.length)
  }

  // Animated style for simple flip
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      transform: [{ perspective: 800 }, { rotateX: `${flipAnimation.value}deg` }],
      opacity: Math.abs(Math.cos((flipAnimation.value * Math.PI) / 180)),
    }
  })

  // Cycle phrases every 5s with flip out/in
  useEffect(() => {
    if (phrases.length <= 1) return

    const animateText = () => {
      // Flip out (0 -> 90)
      flipAnimation.value = withTiming(90, { duration: 300, easing: Easing.inOut(Easing.ease) }, (finished) => {
        'worklet'
        if (finished) {
          // Change text at halfway point
          runOnJS(updatePhraseIndex)()
          // Flip back in (90 -> 0)
          flipAnimation.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
        }
      })
    }

    const interval = setInterval(animateText, 5000)
    return () => clearInterval(interval)
  }, [phrases.length])

 

  const { isLight } = useThemeStore()
   const { user } = useAuthStore()
  const { displayName, availableSocials, themeStyles } = useMemo(() => {
    const firstName = player_name ? player_name.split(" ")[0] : ""
    const computedDisplayName = firstName.length > 10 ? `${firstName.slice(0, 10)}...` : firstName

    // Map using lowercase keys so incoming API variations (e.g. WhatsApp / Whatsapp) still match
    const socialMap = {
      messenger: { icon: "messenger", IconComponent: Fontisto, handler: handleMessenger },
      instagram: { icon: "tiktok", IconComponent: MaterialIcons, handler: handleInstagram },
      whatsapp: { icon: "logo-whatsapp", IconComponent: Ionicons, handler: handleWhatsapp },
    }

    const filteredSocials = socials
      .map((social) => {
        const key = social?.name?.toLowerCase?.() || "";
        if (socialMap[key]) {
          return { ...social, ...socialMap[key] }
        }
        return null
      })
      .filter(Boolean)

    const computedThemeStyles = {
      textColor: isLight ? "#333333" : "#EAEAEA",
      iconColor: isLight ? "#333333" : "#EAEAEA",
      buttonBackground: isLight ? "#fafafa" : "rgba(255, 255, 255, 0.1)",
      profileBackground: isLight ? "#dadada" : "#444444",
    }

    return {
      displayName: computedDisplayName,
      availableSocials: filteredSocials,
      themeStyles: computedThemeStyles,
    }
  }, [player_name, socials, isLight, handleMessenger, handleInstagram, handleWhatsapp])

  const ProfileImage = () => {
    // Determine which tag to show based on user enhancer data (only show active tags)
    const getTagText = () => {
      if (user?.enhancer?.active_hacker_tag) return 'Hckr'
      if (user?.enhancer?.active_pro_tag) return 'Pro'
      return null
    }

    const tagText = getTagText()

    // Tag component to avoid duplication
    const TagComponent = () => (
      tagText ? (
        <View style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: [{ translateX: -12 }],
          backgroundColor: isLight ? '#000000' : '#ffffff',
          paddingHorizontal: scaleWidth(6),
          paddingVertical: scaleWidth(2),
          borderRadius: scaleWidth(8),
          borderWidth: scaleWidth(1),
          borderColor: isLight ? '#ffffff' : '#000000',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          <Text style={{
            color: isLight ? '#ffffff' : '#000000',
            fontSize: scaleWidth(8),
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {tagText}
          </Text>
        </View>
      ) : null
    )

    if (profile_picture) {
      return (
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: profile_picture }}
            style={styles.profileImage}
            resizeMode="cover"
            accessibilityLabel={`${player_name}'s profile picture`}
          />
          <TagComponent />
        </View>
      )
    }

    return (
      <View style={styles.profileImageContainer}>
        <View style={[styles.profileFallback, { backgroundColor: themeStyles.profileBackground }]}>
          <Octicons name="feed-person" size={scaleWidth(32)} color={themeStyles.iconColor} accessibilityLabel="Default profile icon" />
        </View>
        <TagComponent />
      </View>
    )
  }

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: isLight ? '#ffffff' : '#000000',
        borderColor: isLight ? '#333333' : '#ffffff' ,
        shadowColor: isLight ? '#000' : '#fff',
        // borderBottomWidth:5,
        // borderRightWidth:1,
        // borderLeftWidth:1,
        // borderBottomRightRadius:15,
        // borderBottomLeftRadius:15,
      }
    ]}>
      {/* Left Section - Profile and User Info */}
      <View style={styles.leftSection}>
        <Pressable
          style={styles.profileContainer}
          onPress={handleProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <ProfileImage />
        </Pressable>

        <View style={styles.userInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: scaleWidth(6) }}>
            <Text
              style={[styles.greeting, { color: themeStyles.textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
              accessibilityLabel={`Hi, ${displayName}`}
            >
              {
                displayName ? `Hi, ${displayName}` : "Hi, (⁠◠⁠‿⁠◕⁠)"
              }
            </Text>
            <FontAwesome6 name="hand-peace" size={scaleWidth(18)} color={themeStyles.iconColor} />
          </View>

          <Animated.Text
            style={[styles.subtitle, { color: themeStyles.textColor }, animatedTextStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
            accessibilityLabel={phrases[currentPhraseIndex]}
          >
            {phrases[currentPhraseIndex]}
          </Animated.Text>
        </View>

      </View>


      {/* Right Section - Balance and Social Actions */}
      <View style={styles.rightSection}>
        <Pressable
          style={styles.balanceContainer}
          onPress={handleHeaderGamePoint}
        >
          <View style={styles.balanceContent}>
            <MaterialCommunityIcons 
              name="star-four-points-outline" 
              size={scaleWidth(16)} 
              color="#00bf63" 
            />


            <Text style={styles.balanceText}>
              {typeof wallet_balance === "number" ? wallet_balance.toFixed(2) : wallet_balance}
            </Text>
          </View>
            <Ionicons name="add" size={scaleWidth(14)} color="#00bf63" />
        </Pressable>




        {availableSocials.length > 0 && (
          <View style={styles.socialSection}>


            <View style={styles.socialContainer}>
 



              {availableSocials.map((social) => {
                const { IconComponent, icon, handler, name } = social
                return (
                  <Pressable
                    key={name}
                    style={[styles.socialButton, { backgroundColor: themeStyles.buttonBackground }]}
                    onPress={handler}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${name}`}
                  >
                    <IconComponent name={icon} size={scaleWidth(20)} color={themeStyles.iconColor} />
                  </Pressable>
                )
              })}
            </View>



          </View>
        )}
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: scaleWidth(15),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
 
 
  },
  leftSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  profileContainer: {
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: scaleWidth(28),
    marginRight: scaleWidth(12),
    position: 'relative',
  },
  profileImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: scaleWidth(28),
  },
  profileFallback: {
    width: "100%",
    height: "100%",
    borderRadius: scaleWidth(28),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: scaleWidth(2),
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: scaleWidth(16),
    fontWeight: "700",
    marginBottom: 2,
    lineHeight: scaleHeight(24),
  },
  subtitle: {
    fontSize: scaleWidth(14),
    fontWeight: "500",
    opacity: 0.8,
    lineHeight: scaleHeight(18),
  },
  rightSection: {
    alignItems: "flex-end",
    gap: scaleWidth(10),
  },
  balanceContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(24),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scaleHeight(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: scaleWidth(8),
  },
  balanceText: {
    fontSize: scaleWidth(14),
    fontWeight: "700",
    color: "#000000",
    marginLeft: scaleWidth(6),
  },
 
  socialSection: {
    alignItems: "flex-end",
    gap: scaleWidth(6),

  },
  contactUsText: {
    fontSize: scaleWidth(12),
    fontWeight: "500",
    opacity: 0.8,
    textAlign: "right",
  },
  socialContainer: {
    flexDirection: "row",
    gap: scaleWidth(8),

  },
  socialButton: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    borderRadius: scaleWidth(21),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scaleHeight(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
})