"use client"

import React from "react"
import { Pressable, StatusBar, StyleSheet, Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { useThemeStore } from "../store/themeStore"

/**
 * Minimalist NoConnection screen
 * - Shows a Wi‑Fi icon
 * - One line of text: "No Internet Connection, tap to retry"
 * - Entire screen is tappable; calls onRetry when pressed
 */
const NoConnection = ({ onRetry }) => {
  const { isLight } = useThemeStore()

  const bg = isLight ? "#ffffff" : "#000000"
  const fg = isLight ? "#111111" : "#EAEAEA"
  const sub = isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)"

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />

      <Pressable
        style={styles.center}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="No Internet Connection, tap to retry"
      >
        <MaterialIcons name="wifi-off" size={72} color={fg} />
        <Text style={[styles.text, { color: fg }]}>No Internet Connection</Text>
        <Text style={[styles.subtext, { color: sub }]}>Tap to retry</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default NoConnection

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subtext: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
})
