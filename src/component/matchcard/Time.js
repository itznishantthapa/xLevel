import { scaleHeight, scaleWidth } from "../../utils/scaling";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { timeAgo } from "./index/timeFormatter";

// InfoRow Component - shared between both cards
export const Time = ({ time = '2 min ago', isDark = false, forMatch = false }) => {

  const colors = {
    borderColor: isDark ? '#eaf4f4' : '#000000',
    labelColor: isDark ? '#eaf4f4' : '#000000',
    timeColor: isDark ? '#eaf4f4' : '#000000',
  }
  return (
    <View style={[styles.container, { borderColor: colors.borderColor, borderWidth: 1, backgroundColor: 'transparent' }]}>
      <MaterialCommunityIcons name="clock-time-two" size={16} color={!isDark ? "#666" : "#999"} />
      {
        forMatch ? (
          <Text style={[styles.time, { color: colors.timeColor }]} numberOfLines={1} adjustsFontSizeToFit={true}>
            {`Match Created: ${timeAgo(time)}`}
          </Text>
        ) : (
          <Text style={[styles.time, { color: colors.timeColor }]} numberOfLines={1} adjustsFontSizeToFit={true}>
            {timeAgo(time)}
          </Text>
        )
      }

    </View>
  )

}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#d9d9d980',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(6),
    alignSelf: 'flex-start',
    gap: scaleWidth(10),
    borderRadius: scaleWidth(20),
    minHeight: scaleHeight(32),
    flexShrink: 0,
  },
  label: {
    fontSize: scaleWidth(14),
    fontWeight: 'bold',
  },
  time: {
    fontSize: scaleWidth(14),
    color: '#333333',
    fontWeight: 'bold',
    textAlign: 'left',
    includeFontPadding: false,
  },

});