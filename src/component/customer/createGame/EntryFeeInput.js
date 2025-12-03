import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import React from 'react';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SectionTitle from './SectionTitle';
import { scaleWidth, scaleHeight } from '../../../utils/scaling';

/**
 * EntryFeeInput component for game entry fee input with winning calculation
 * @param {string} value - Current entry fee value
 * @param {function} onChangeText - Function to call when text changes
 * @param {string} winningAmount - Calculated winning amount
 * @param {boolean} isLight - Whether light theme is active
 * @param {string} gameName - Name of the game (optional)
 * @param {string} gameMode - Mode of the game (optional)
 * @returns {JSX.Element}
 */
const EntryFeeInput = ({ value, onChangeText, winningAmount, isLight, gameName, gameMode }) => {
  // Determine minimum entry points based on game type
  const getMinimumPoints = () => {
    if (gameName?.toLowerCase().includes('chess') || gameMode?.toLowerCase() === 'lone wolf') {
      return 10;
    }
    return 20;
  };

  const minimumPoints = getMinimumPoints();
  const placeholder = `Enter Points (Min. ${minimumPoints})`;
  
  return (
    <View style={styles.section}>
      <SectionTitle title="Game Points" isLight={isLight} />
      <View style={styles.potContainer}>
        <View style={[
          styles.potInputContainer, 
          { 
            borderColor: isLight ? "#000000" : "#ffffff",
            backgroundColor: 'transparent',
          }
        ]}>
          <View style={[
            styles.pointsIconContainer,
            { backgroundColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)' },
            isLight && {
              elevation: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 4.5,
            }
          ]}>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={scaleWidth(16)}
              color={isLight ? "#ffffff" : "#20c997"}
            />
          </View>
          <TextInput
            style={[styles.potInput, { color: isLight ? "#333333" : "#ffffff" }]}
            value={value}
            onChangeText={onChangeText}
            keyboardType="decimal-pad"
            placeholder={placeholder}
            placeholderTextColor={isLight ? "#666666" : "#cccccc"}
          />
        </View>
        {
          Platform.OS === 'android' && (
            <Text style={[styles.winningText, { color: isLight ? "#666666" : "#cccccc" }]}>
              Potential winning: <Text style={{ color: "#00C851" }}>{winningAmount}</Text> points
            </Text>
          )
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  potContainer: {
    gap: 8,
  },
  potInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scaleWidth(1.5),
    borderRadius: scaleWidth(25),
    paddingHorizontal: scaleWidth(8),
    gap: scaleWidth(12),
  },
  pointsIconContainer: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  potInput: {
    flex: 1,
    paddingVertical: scaleHeight(14),
    fontSize: scaleWidth(16),
    padding: 0,
  },
  winningText: {
    fontSize: 13,
  },
  feeText: {
    fontSize: 12,
    color: "#666666",
  },
});

export default EntryFeeInput;
