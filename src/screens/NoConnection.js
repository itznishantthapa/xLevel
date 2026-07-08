"use client"

import React, { useState } from "react"
import { ActivityIndicator, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppIcon } from "../components/common/AppIcon"
import { RefreshIcon } from "@hugeicons/core-free-icons"
import { iconSize } from "../theme/typography"
import { useThemeStore } from "../store/themeStore"

/**
 * Professional NoConnection screen with minimal stylish design
 * - App logo at center
 * - Minimal text
 * - Clean retry button with loading state
 */
const NoConnection = ({ onRetry }) => {
  const { isLight } = useThemeStore()
  const [isRetrying, setIsRetrying] = useState(false)

  const themeStyles = {
    bg: isLight ? "#ffffff" : "#000000",
    fg: isLight ? "#000000" : "#ffffff",
    logoBg: isLight ? "#000000" : "#1a1a1a",
    subtitleColor: isLight ? "#666666" : "#999999",
    buttonBg: isLight ? "#000000" : "#ffffff",
    buttonText: isLight ? "#000000" : "#ffffff",
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      // Reset after a short delay to give feedback
      setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />

      <View style={styles.content}>
        {/* No Internet Image */}
        <Image
          source={require("../assets/NoInternet.png")}
          style={styles.illImage}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={[styles.title, { color: themeStyles.fg }]}>Oops!</Text>

        {/* Retry Button */}
        <Pressable
          style={[styles.retryButton, { 
            backgroundColor: "transparent",
            borderColor: themeStyles.buttonBg,
            borderWidth: 1.5,
          }]}
          onPress={handleRetry}
          disabled={isRetrying}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={themeStyles.buttonText} />
          ) : (
            <AppIcon icon={RefreshIcon} size={iconSize.sm} color={themeStyles.buttonText} />
          )}
          <Text style={[styles.retryButtonText, { color: themeStyles.buttonText }]}>
            {isRetrying ? "Retrying..." : "Try Again"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

export default NoConnection

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  illImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
