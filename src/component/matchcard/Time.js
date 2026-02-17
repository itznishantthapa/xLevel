import { scaleHeight, scaleWidth } from "../../utils/scaling";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { timeAgo } from "./index/timeFormatter";

// InfoRow Component - shared between both cards
export const Time = ({ time = '2 min ago', isDark = false, forMatch = false }) => {

  const colors = {
    bgColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    textColor: isDark ? '#e0e0e0' : '#4a4a4a',
    iconColor: isDark ? '#b0b0b0' : '#666666',
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.bgColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }]}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={colors.iconColor} />
      </View>
      {
        forMatch ? (
          <Text style={[styles.time, { color: colors.textColor }]} numberOfLines={1}>
            {`Created ${timeAgo(time)}`}
          </Text>
        ) : (
          <Text style={[styles.time, { color: colors.textColor }]} numberOfLines={1}>
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
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    alignSelf: 'flex-start',
    gap: scaleWidth(8),
    borderRadius: scaleWidth(24),
    minHeight: scaleHeight(36),
    flexShrink: 0,
  },
  iconContainer: {
    width: scaleWidth(28),
    height: scaleHeight(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: scaleWidth(14),
    fontWeight: 'bold',
  },
  time: {
    fontSize: scaleWidth(13),
    fontWeight: '600',
    textAlign: 'left',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },

});