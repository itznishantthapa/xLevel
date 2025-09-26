import { View, StyleSheet } from 'react-native';
import React from 'react';

/**
 * DividerLine component for separating sections
 * @param {boolean} isLight - Whether light theme is active
 * @returns {JSX.Element}
 */
const DividerLine = ({ isLight }) => {
  return (
    <View 
      style={[
        styles.dividerLine,
        { backgroundColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)' }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dividerLine: {
    width: '100%',
    height: 1,
    marginVertical: 12,
  },
});

export default DividerLine;
