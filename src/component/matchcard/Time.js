import { View, Text, StyleSheet } from "react-native";
import { AppIcon } from "../../components/common/AppIcon";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { fontSize, spacing, iconSize } from "../../theme/typography";
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
        <AppIcon icon={Clock01Icon} size={iconSize.sm} color={colors.iconColor} />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderRadius: spacing["2xl"],
    minHeight: 36,
    flexShrink: 0,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: fontSize.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },

});