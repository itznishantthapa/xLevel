import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { scaleWidth } from "../../../utils/scaling";

/**
 * GameInfoHeader component for displaying game name and mode with icon
 * @param {string} gameName - Name of the game
 * @param {string} gameMode - Game mode
 * @param {boolean} isLight - Whether light theme is active
 * @returns {JSX.Element}
 */
const GameInfoHeader = ({ gameName, gameMode, isLight }) => {
  return (
    <View style={styles.section}>
      <View style={styles.gameInfoContainer}>
        <FontAwesome name="gears" size={scaleWidth(20)} color={isLight ? "#333333" : "#ffffff"} />
        <View style={styles.gameInfoItem}>
          <Text 
            style={[
              styles.value, 
              { 
                color: isLight ? "#333333" : "#ffffff",
                borderBottomColor: isLight ? "#000000" : "#ffffff", 
                marginLeft: 5 
              }
            ]}
          >
            {gameName}
          </Text>
        </View>
        <View style={styles.gameInfoItem}>
          <Text 
            style={[
              styles.value, 
              { 
                color: isLight ? "#333333" : "#ffffff", 
                marginLeft: 5,
                borderBottomColor: isLight ? "#000000" : "#ffffff"
              }
            ]}
          >
            {gameMode}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  gameInfoContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  gameInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    borderBottomWidth: 1,
  },
});

export default GameInfoHeader;
