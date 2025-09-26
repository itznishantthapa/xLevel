"use client"

import { Pressable, StyleSheet, Text, View, Animated } from "react-native"
import { useEffect, useRef } from "react"
import LoaderKitView from "react-native-loader-kit"
import { useThemeStore } from "../../../store/themeStore"


const CoolButton = ({ handlePress, disableBtn=false, title }) => {
  const { isLight } = useThemeStore()

  const textOpacity = useRef(new Animated.Value(1)).current
  const loaderOpacity = useRef(new Animated.Value(0)).current
  const loaderScale = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (disableBtn) {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(loaderScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(loaderOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(loaderScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [disableBtn])

  return (
    <View >
      <Pressable
        style={[styles.submitButton, { backgroundColor: isLight ? "#000000" : "#eaf4f4" }]}
        onPress={handlePress}
        disabled={disableBtn}
      >
        <Animated.View style={[styles.contentContainer, { opacity: textOpacity }]}>
          <Text style={[styles.submitButtonText, { color: isLight ? "#ffffff" : "#000000" }]}>{title}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.loaderContainer,
            {
              opacity: loaderOpacity,
              transform: [{ scale: loaderScale }],
            },
          ]}
        >
          <LoaderKitView
            style={{ width: 30, height: 30 }}
            name={"BallPulse"}
            animationSpeedMultiplier={1.0}
            color={isLight ? "#ffffff" : "#000000"}
          />
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default CoolButton

const styles = StyleSheet.create({

  submitButton: {
    paddingVertical: 22,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative", 
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  contentContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
})
