import { Text, View } from "react-native"
import { AppIcon } from "../../components/common/AppIcon"
import { HashtagIcon } from "@hugeicons/core-free-icons"
import { spacing, iconSize } from "../../theme/typography"

/**
 * StampID Component
 * Displays the challenge/game ID in a stamp sticker style
 */
const StampID = ({ gameId, isLight, compact = false }) => {
  return (
    <View
      style={{
        marginTop: (compact ? 8 : 12),
        alignSelf: 'center',
        maxWidth: '100%',
        paddingHorizontal: (compact ? 12 : 12),
        paddingVertical: (compact ? 6 : 8),
        borderRadius: spacing.md,
        borderWidth: spacing.xxs,
        borderColor: isLight ? '#333333' : '#eaf4f4',
        borderStyle: 'dashed',
        backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
        transform: [{ rotate: '-8deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AppIcon
          icon={HashtagIcon}
          size={(compact ? iconSize.sm : iconSize.md)}
          color="#FF9500"
          style={{ flexShrink: 0 }}
        />
        <Text
          style={{
            fontSize: (compact ? 12 : 14),
            fontWeight: '700',
            color: isLight ? '#333333' : '#eaf4f4',
            letterSpacing: 0.25,
            fontVariant: ['tabular-nums'],
            includeFontPadding: false,
            lineHeight: (compact ? 16 : 18),
            flexShrink: 1,
          }}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {gameId}
        </Text>
      </View>
    </View>
  )
}

export default StampID
