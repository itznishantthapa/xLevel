"use client"

import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo, useEffect, useState } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { AppIcon, PointsIcon } from "../../components/common/AppIcon"
import { UserIcon, Add01Icon } from "@hugeicons/core-free-icons"
import { useThemeStore } from "../../store/themeStore"
import { useUtils } from "../../queries/useUtils"
import { fontSize, spacing, radius, iconSize, lineHeight } from "../../theme/typography"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from "react-native-reanimated"
import { usePointCreditAnimationStore } from "../../store/pointCreditAnimationStore"
import { POINT_LOAD_PULSE_DURATION_MS } from "../../utils/pointLoadSound"

const Header = ({
  player_name,
  wallet_balance,
  profile_picture,
  handleProfile,
  handleHeaderGamePoint,
}) => {
  const { data: utils = {} } = useUtils()

  const phrases = useMemo(() => {
    const list = utils?.phrases?.map((p) => p?.text).filter(Boolean) || []
    return list.length ? list : ["Get ready for the battle."]
  }, [utils])

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const flipAnimation = useSharedValue(0)
  const pulseProgress = useSharedValue(0)
  const pulseKey = usePointCreditAnimationStore((state) => state.pulseKey)

  useEffect(() => {
    if (pulseKey === 0) return

    pulseProgress.value = 0
    pulseProgress.value = withTiming(1, {
      duration: POINT_LOAD_PULSE_DURATION_MS,
      easing: Easing.bezier(0.22, 1.18, 0.36, 1),
    })
  }, [pulseKey, pulseProgress])

  const walletAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseProgress.value,
      [0, 0.22, 0.48, 0.74, 1],
      [1, 1.26, 0.94, 1.06, 1],
      Extrapolation.CLAMP,
    )

    return { transform: [{ scale }] }
  })

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseProgress.value,
      [0, 0.26, 0.52, 0.78, 1],
      [1, 1.48, 0.92, 1.1, 1],
      Extrapolation.CLAMP,
    )

    return { transform: [{ scale }] }
  })

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

  const { displayName, themeStyles } = useMemo(() => {
    const firstName = player_name ? player_name.split(" ")[0] : ""
    const computedDisplayName = firstName.length > 10 ? `${firstName.slice(0, 10)}...` : firstName

    return {
      displayName: computedDisplayName,
      themeStyles: {
        textColor: isLight ? "#333333" : "#EAEAEA",
        iconColor: isLight ? "#000000" : "#EAEAEA",
        profileBackground: isLight ? "#dadada" : "#444444",
      },
    }
  }, [player_name, isLight])

  const ProfileImage = () => {
    if (profile_picture) {
      return (
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: profile_picture }}
            style={styles.profileImage}
            resizeMode="cover"
            accessibilityLabel={`${player_name}'s profile picture`}
          />
        </View>
      )
    }

    return (
      <View style={styles.profileImageContainer}>
        <View style={[styles.profileFallback, { backgroundColor: themeStyles.profileBackground }]}>
          <AppIcon icon={UserIcon} size={iconSize.md} color={themeStyles.iconColor} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.header, isLight ? styles.headerLight : styles.headerDark]}>
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
          <Animated.View style={walletAnimatedStyle}>
            <LinearGradient
              colors={['#ffffff', '#f8fbff', '#f0f8ff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceContainer}
            >
              <View style={styles.balanceContent}>
                <Animated.View style={iconAnimatedStyle}>
                  <PointsIcon size={iconSize.sm} color="#00bf63" />
                </Animated.View>
                <Text style={styles.balanceText}>
                  {typeof wallet_balance === "number" ? wallet_balance.toFixed(2) : wallet_balance}
                </Text>
              </View>
              <AppIcon icon={Add01Icon} size={iconSize.sm} color="#00bf63" />
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
})
