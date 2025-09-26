import { Text, StyleSheet } from 'react-native';
import React from 'react';

/**
 * SectionTitle component for consistent section headings
 * @param {string} title - Title text to display
 * @param {boolean} isLight - Whether light theme is active
 * @returns {JSX.Element}
 */
const SectionTitle = ({ title, isLight }) => {
  return (
    <Text 
      style={[
        styles.sectionTitle, 
        { color: isLight ? "#333333" : "#ffffff" }
      ]}
    >
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
});

export default SectionTitle;
