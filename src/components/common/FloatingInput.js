import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons';
import { fontSize, iconSize, radius, spacing } from '../../theme/typography';

const INPUT_HEIGHT = 48;

const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  secureTextEntry,
  onToggleSecure,
  secureVisible,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize = 'none',
  keyboardType = 'default',
  colors,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;
  const isFloating = isFocused || value.length > 0;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [animation, isFloating]);

  const labelTop = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [(INPUT_HEIGHT - (fontSize.md + 2)) / 2, -9],
  });

  const labelFontSize = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });

  return (
    <View style={styles.inputGroup}>
      <View
        style={[
          styles.inputShell,
          {
            borderColor: error ? colors.error : isFocused ? colors.text : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <AppIcon
          icon={icon}
          size={iconSize.md}
          color={isFocused ? colors.text : colors.textMuted}
          strokeWidth={1.5}
        />

        <View style={styles.inputBody}>
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                lineHeight: fontSize.md + 2,
                color: isFocused ? colors.text : colors.textMuted,
                backgroundColor: colors.surface,
              },
            ]}
            pointerEvents="none"
          >
            {label}
          </Animated.Text>

          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, paddingTop: isFloating ? spacing.sm : 0 },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            placeholder=""
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={8} style={styles.eyeButton}>
            <AppIcon
              icon={secureVisible ? EyeIcon : EyeOffIcon}
              size={iconSize.md}
              color={colors.textMuted}
              strokeWidth={1.5}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

export default FloatingInput;

const styles = StyleSheet.create({
  inputGroup: {
    gap: spacing.xs,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  inputBody: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: spacing.xs,
    marginLeft: -spacing.xs,
  },
  textInput: {
    flex: 1,
    paddingBottom: 0,
    fontSize: fontSize.md,
    lineHeight: fontSize.md + 2,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    paddingHorizontal: spacing.xs,
  },
});
