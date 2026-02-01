import { Pressable, StyleSheet, Text } from "react-native";
import React from "react";

/**
 * OptionButton component for game settings selection
 * @param {boolean} isSelected - Whether this option is selected
 * @param {string} label - Text to display on the button
 * @param {function} onPress - Function to call when pressed
 * @param {boolean} isLight - Whether light theme is active
 * @returns {JSX.Element}
 */
const OptionButton = ({ isSelected, label, onPress, isLight }) => (
  <Pressable
    style={[
      styles.optionButton,
      isSelected && styles.optionButtonSelected,
      {
        backgroundColor: isSelected ? (isLight ? "#000000" : "#ffffff") : isLight ? "#f5f5f5" : "#1a1a1a",
        borderColor: isSelected ? (isLight ? "#333333" : "#ffffff") : isLight ? "#cccccc" : "#333333",
      },
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.optionButtonText,
        {
          color: isSelected ? (isLight ? "#ffffff" : "#000000") : isLight ? "#666666" : "#cccccc",
        },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  optionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
    // borderRadius: 10,
  },
  optionButtonSelected: {
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

export default OptionButton;
