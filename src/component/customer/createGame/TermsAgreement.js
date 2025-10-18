import { View, Text, StyleSheet, Pressable } from 'react-native';
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
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

  // Colors for strict black/white checkbox design
  const borderColor = isLight ? "#000000" : "#ffffff";
  const checkedBackground = isLight ? "#000000" : "#ffffff";
  const checkColor = isLight ? "#ffffff" : "#000000";
  const textColor = isLight ? "#000000" : "#ffffff";

  return (
    <View style={styles.termsContainer}>
      <View style={styles.checkboxContainer}>
        {/* Make checkbox + terms text both toggleable */}
        <Pressable
          onPress={onToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.pressableArea}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!isAccepted }}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                borderColor,
                backgroundColor: isAccepted ? checkedBackground : 'transparent',
              },
            ]}
          >
            {isAccepted ? (
              <Text style={[styles.checkMark, { color: checkColor }]}>✓</Text>
            ) : null}
          </View>
          <Animated.Text
            style={[
              styles.termsText,
              { color: textColor },
              shakeAnimatedStyle,
            ]}
          >
            {termsText}
          </Animated.Text>
        </Pressable>

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
  pressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
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
