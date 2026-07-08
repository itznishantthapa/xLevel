"use client"

import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo, useEffect, useState } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { AppIcon, PointsIcon } from "../../components/common/AppIcon"
import {
  UserIcon,
  Add01Icon,
  MessengerIcon,
  TiktokIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"
import { useThemeStore } from "../../store/themeStore"
import { useSocials } from "../../queries/useSocials"
import { useAuthStore } from "../../store/authStore"
import { useUtils } from "../../queries/useUtils"
import { fontSize, spacing, radius, iconSize, lineHeight } from "../../theme/typography"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from "react-native-reanimated"

const SOCIAL_ICON_MAP = {
  messenger: MessengerIcon,
  instagram: TiktokIcon,
  whatsapp: WhatsappIcon,
}

const Header = ({
  player_name,
  wallet_balance,
  profile_picture,
  handleProfile,
  handleMessenger,
  handleInstagram,
  handleWhatsapp,
  handleHeaderGamePoint,
  showSocials = true,
}) => {
  const { data: socials = [] } = useSocials()
  const { data: utils = {} } = useUtils()

  const phrases = useMemo(() => {
    const list = utils?.phrases?.map((p) => p?.text).filter(Boolean) || []
    return list.length ? list : ["Get ready for the battle."]
  }, [utils])

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const flipAnimation = useSharedValue(0)

  useEffect(() => {
    setCurrentPhraseIndex(0)
    flipAnimation.value = 0
  }, [phrases.length])

  const updatePhraseIndex = () => {
    setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
  }

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateX: `${flipAnimation.value}deg` }],
    opacity: Math.abs(Math.cos((flipAnimation.value * Math.PI) / 180)),
  }))

  useEffect(() => {
    if (phrases.length <= 1) return

    const animateText = () => {
      flipAnimation.value = withTiming(90, { duration: 300, easing: Easing.inOut(Easing.ease) }, (finished) => {
        'worklet'
        if (finished) {
          runOnJS(updatePhraseIndex)()
          flipAnimation.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
        }
      })
    }

    const interval = setInterval(animateText, 3000)
    return () => clearInterval(interval)
  }, [phrases.length])

  const { isLight } = useThemeStore()
  const { user } = useAuthStore()

  const { displayName, availableSocials, themeStyles } = useMemo(() => {
    const firstName = player_name ? player_name.split(" ")[0] : ""
    const computedDisplayName = firstName.length > 10 ? `${firstName.slice(0, 10)}...` : firstName

    const filteredSocials = socials
      .map((social) => {
        const key = social?.name?.toLowerCase?.() || ""
        const icon = SOCIAL_ICON_MAP[key]
        if (!icon) return null

        const handlers = {
          messenger: handleMessenger,
          instagram: handleInstagram,
          whatsapp: handleWhatsapp,
        }

        return { ...social, icon, handler: handlers[key] }
      })
      .filter(Boolean)

    return {
      displayName: computedDisplayName,
      availableSocials: filteredSocials,
      themeStyles: {
        textColor: isLight ? "#333333" : "#EAEAEA",
        iconColor: isLight ? "#000000" : "#EAEAEA",
        buttonBackground: isLight ? "#f5f5f5" : "rgba(255, 255, 255, 0.1)",
        profileBackground: isLight ? "#dadada" : "#444444",
      },
    }
  }, [player_name, socials, isLight, handleMessenger, handleInstagram, handleWhatsapp])

  const ProfileImage = () => {
    const getTagText = () => {
      if (user?.enhancer?.active_hacker_tag) return 'Hckr'
      if (user?.enhancer?.active_pro_tag) return 'Pro'
      return null
    }

    const tagText = getTagText()

    const TagComponent = () =>
      tagText ? (
        <View style={[styles.tagBadge, isLight ? styles.tagLight : styles.tagDark]}>
          <Text style={[styles.tagText, isLight ? styles.tagTextLight : styles.tagTextDark]}>
            {tagText}
          </Text>
        </View>
      ) : null

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
          <AppIcon icon={UserIcon} size={iconSize.md} color={themeStyles.iconColor} />
        </View>
        <TagComponent />
      </View>
    )
  }

  return (
    <View style={[styles.header, !showSocials && styles.headerCompact, isLight ? styles.headerLight : styles.headerDark]}>
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
          <Text
            style={[styles.greeting, { color: themeStyles.textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName ? `Hi, ${displayName}` : "Hi, (⁠◠⁠‿⁠◕⁠)"}
          </Text>

          <Animated.Text
            style={[styles.subtitle, { color: themeStyles.textColor }, animatedTextStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {phrases[currentPhraseIndex]}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Pressable onPress={handleHeaderGamePoint}>
          <LinearGradient
            colors={['#ffffff', '#f8fbff', '#f0f8ff', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceContainer}
          >
            <View style={styles.balanceContent}>
              <PointsIcon size={iconSize.sm} color="#00bf63" />
              <Text style={styles.balanceText}>
                {typeof wallet_balance === "number" ? wallet_balance.toFixed(2) : wallet_balance}
              </Text>
            </View>
            <AppIcon icon={Add01Icon} size={iconSize.sm} color="#00bf63" />
          </LinearGradient>
        </Pressable>

        {showSocials && availableSocials.length > 0 && (
          <View style={styles.socialContainer}>
            {availableSocials.map((social) => (
              <Pressable
                key={social.name}
                style={[styles.socialButton, { backgroundColor: themeStyles.buttonBackground }]}
                onPress={social.handler}
                accessibilityRole="button"
                accessibilityLabel={`Open ${social.name}`}
              >
                <AppIcon icon={social.icon} size={iconSize.sm} color={themeStyles.iconColor} />
              </Pressable>
            ))}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerLight: {
    backgroundColor: 'transparent',
    borderColor: '#333333',
    shadowColor: '#000',
  },
  headerDark: {
    backgroundColor: '#000000',
    borderColor: '#ffffff',
    shadowColor: '#fff',
  },
  headerCompact: {
    alignItems: "center",
    paddingBottom: spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
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
    borderRadius: 24,
  },
  profileFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tagBadge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: [{ translateX: -12 }],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagLight: {
    backgroundColor: '#000000',
    borderColor: '#ffffff',
  },
  tagDark: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
  },
  tagText: {
    fontSize: fontSize.xxs,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagTextLight: { color: '#ffffff' },
  tagTextDark: { color: '#000000' },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: 2,
    lineHeight: lineHeight.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: "500",
    opacity: 0.75,
    lineHeight: lineHeight.md,
    paddingVertical: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  balanceContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  balanceText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: "#000000",
    marginLeft: spacing.sm,
    lineHeight: lineHeight.md,
  },
  socialContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
})
