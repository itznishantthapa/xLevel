import { View, StyleSheet, Text } from 'react-native';
import React from 'react';
import OptionButton from './OptionButton';

/**
 * BooleanOptionsSection component for Yes/No options
 * @param {string} title - Section title
 * @param {Array} options - Array of option objects with key and label
 * @param {Object} currentValues - Object containing current boolean values keyed by option keys
 * @param {function} onSelect - Function to call when an option is selected (key, value) => {}
 * @param {boolean} isLight - Whether light theme is active
 * @returns {JSX.Element}
 */
const BooleanOptionsSection = ({  options, currentValues, onSelect, isLight }) => {
  return (
    <View style={[styles.section, { marginBottom: 10 }]}>
      <View style={styles.rulesContainer}>
        {options.map((option) => (
          <View key={option.key} style={styles.ruleRow}>
            <Text style={[styles.sectionTitle, { color: isLight ? "#333333" : "#ffffff" }]}>
              {option.label}
            </Text>
            <View style={styles.optionsContainer}>
              <OptionButton
                isSelected={currentValues[option.key] === true}
                label="Yes"
                onPress={() => onSelect(option.key, true)}
                isLight={isLight}
              />
              <OptionButton
                isSelected={currentValues[option.key] === false}
                label="No"
                onPress={() => onSelect(option.key, false)}
                isLight={isLight}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  rulesContainer: {
    gap: 12,
  },
  ruleRow: {
    gap: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});

export default BooleanOptionsSection;
