import { View, Text, StyleSheet, Pressable } from 'react-native';
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { fontSize, spacing } from '../../../theme/typography';

/**
 * TermsAgreement component for accepting game rules with shake animation
 * @param {boolean} isAccepted - Whether terms are accepted
 * @param {function} onToggle - Function to call when checkbox is toggled
 * @param {boolean} isLight - Whether light theme is active
 * @param {function} onReadRules - Function to call when "Read Rules" is pressed
 * @param {string} text - Custom terms text (optional)
 * @param {React.Ref} ref - Reference to access shake function
 * @returns {JSX.Element}
 */
const TermsAgreement = forwardRef(({ isAccepted, onToggle, isLight, onReadRules, text }, ref) => {
  const termsText = text || "I've accepted the game rules & terms.";
  
  // Shared value for shake animation
  const shakeOffset = useSharedValue(0);

  // Shake animation function
  const shakeTermsText = useCallback(() => {
    'worklet'
    shakeOffset.value = withSequence(
      withTiming(spacing.sm, { duration: 50 }),
      withTiming(-spacing.sm, { duration: 50 }),
      withTiming(spacing.sm, { duration: 50 }),
      withTiming(-spacing.sm, { duration: 50 }),
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
          hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
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
            <Text style={styles.rulesLinkText}>[ GO TO RULES ]</Text>
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
    flexWrap: 'wrap',
  },
  pressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  checkboxBox: {
    width: spacing.xl,
    height: spacing.xl,
    borderWidth: 2,
    borderRadius: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    lineHeight: fontSize.sm,
    marginTop: -1,
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 18,
    fontWeight: "400",
  },
  rulesLink: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  rulesLinkText: {
    color: "#00bf63",
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default TermsAgreement;
