import { View, Text, StyleSheet, Pressable } from 'react-native';
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";

/**
 * TermsAgreement component for accepting game rules with shake animation
 * @param {boolean} isAccepted - Whether terms are accepted
 * @param {function} onToggle - Function to call when checkbox is toggled
 * @param {boolean} isLight - Whether light theme is active
 * @param {function} onReadRules - Function to call when "Read Rules" is pressed
 * @param {React.Ref} ref - Reference to access shake function
 * @returns {JSX.Element}
 */
const TermsAgreement = forwardRef(({ isAccepted, onToggle, isLight, onReadRules }, ref) => {
  const termsText = "I have read the game rules and regulation.";
  
  // Shared value for shake animation
  const shakeOffset = useSharedValue(0);

  // Shake animation function
  const shakeTermsText = useCallback(() => {
    'worklet'
    shakeOffset.value = withSequence(
      withTiming(8, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    )
  }, [shakeOffset]);

  // Expose shake function to parent component
  useImperativeHandle(ref, () => ({
    shake: shakeTermsText
  }), [shakeTermsText]);

  // Animated style for shake effect
  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  return (
    <View style={styles.termsContainer}>
      <View style={styles.checkboxContainer}>
        <Pressable onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons
            name={isAccepted ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={isAccepted ? "#00C851" : isLight ? "#666666" : "#cccccc"}
          />
        </Pressable>
        <Animated.Text
          style={[
            styles.termsText,
            {
              color: isLight ? "#333333" : "#ffffff",
            },
            shakeAnimatedStyle,
          ]}
        >
          {termsText}
        </Animated.Text>
              {onReadRules && (
        <Pressable style={styles.rulesLink} onPress={onReadRules}>
          <Text style={styles.rulesLinkText}>Read rules</Text>
        </Pressable>
      )}
      </View>

    </View>
  );
});

const styles = StyleSheet.create({
  termsContainer: {
    marginTop: 10,
    justifyContent: "flex-start",
    alignItems: "center",
 

  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  rulesLink: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  rulesLinkText: {
    color: "#00C851",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default TermsAgreement;
