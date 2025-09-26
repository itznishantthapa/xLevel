import { View, StyleSheet } from 'react-native';
import React from 'react';
import SectionTitle from './SectionTitle';
import OptionButton from './OptionButton';

/**
 * OptionsSection component for displaying a set of options
 * @param {string} title - Section title
 * @param {Array} options - Array of option values to display
 * @param {string|number} selectedValue - Currently selected value
 * @param {function} onSelect - Function to call when an option is selected, gets passed the value
 * @param {boolean} isLight - Whether light theme is active
 * @param {string} valueKey - Object key to use for selection comparison (optional)
 * @returns {JSX.Element}
 */
const OptionsSection = ({ title, options, selectedValue, onSelect, isLight, valueKey, marginBottom = 10 }) => {
  return (
    <View style={[styles.section, { marginBottom }]}>
      <SectionTitle title={title} isLight={isLight} />
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          // If options are strings/numbers, use directly. If objects, use valueKey to extract value
          const value = typeof option === 'object' && valueKey ? option[valueKey] : option;
          // For display, either use the value directly or a label if provided
          const label = typeof option === 'object' && option.label ? option.label : String(value);
          
          return (
            <OptionButton
              key={value}
              isSelected={selectedValue === value}
              label={label}
              onPress={() => onSelect(value)}
              isLight={isLight}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});

export default OptionsSection;
