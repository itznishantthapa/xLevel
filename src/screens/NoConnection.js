"use client"

import React, { useState } from "react"
import { ActivityIndicator, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
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
    buttonText: isLight ? "#ffffff" : "#000000",
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
        {/* App Logo with Background */}
        <View style={[styles.logoContainer, { backgroundColor: themeStyles.logoBg }]}>
          <Image
            source={require("../assets/level.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: themeStyles.fg }]}>No Connection</Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: themeStyles.subtitleColor }]}>
          Check your internet and try again
        </Text>

        {/* Retry Button */}
        <Pressable
          style={[styles.retryButton, { backgroundColor: themeStyles.buttonBg }]}
          onPress={handleRetry}
          disabled={isRetrying}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={themeStyles.buttonText} />
          ) : (
            <MaterialIcons name="refresh" size={18} color={themeStyles.buttonText} />
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
    paddingHorizontal: 32,
    gap: 12,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
