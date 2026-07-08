import { Text, View } from "react-native"
import { spacing } from "../../theme/typography"

/**
 * SlotStamp Component
 * Displays the player's slot number in a stamp sticker style
 */
const SlotStamp = ({ slotNumber, isLight, compact = false }) => {
  return (
    <View
      style={{
        alignSelf: 'center',
        maxWidth: '100%',
        paddingHorizontal: (compact ? 14 : 16),
        paddingVertical: (compact ? 8 : 10),
        borderRadius: spacing.md,
        borderWidth: spacing.xxs,
        borderColor: isLight ? '#000000' : '#ffffff',
        borderStyle: 'dashed',
        backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
        transform: [{ rotate: '0deg' }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Text
          style={{
            fontSize: (compact ? 13 : 15),
            fontWeight: 'bold',
            color: '#27a300',
            includeFontPadding: false,
            lineHeight: (compact ? 18 : 20),
          }}
          numberOfLines={1}
        >
          Slot No.
        </Text>
        <Text
          style={{
            fontSize: (compact ? 13 : 15),
            fontWeight: '900',
            color: isLight ? '#000000' : '#ffffff',
            letterSpacing: 0.5,
            fontVariant: ['tabular-nums'],
            includeFontPadding: false,
            lineHeight: (compact ? 18 : 20),
          }}
          numberOfLines={1}
        >
          " {slotNumber ?? '—'} "
        </Text>
      </View>
    </View>
  )
}

export default SlotStamp
