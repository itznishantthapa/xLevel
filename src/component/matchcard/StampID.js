import { Text, View, Platform } from "react-native"
import { Fontisto } from "@expo/vector-icons"
import { scaleHeight, scaleWidth } from "../../utils/scaling"

/**
 * StampID Component
 * Displays the challenge/game ID in a stamp sticker style
 */
const StampID = ({ gameId, isLight, compact = false }) => {
  return (
    <View
      style={{
        marginTop: scaleHeight(compact ? 8 : 12),
        alignSelf: 'center',
        maxWidth: '100%',
        paddingHorizontal: scaleWidth(compact ? 12 : 12),
        paddingVertical: scaleHeight(compact ? 6 : 8),
        borderRadius: scaleWidth(12),
        borderWidth: scaleWidth(2),
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(6) }}>
        <Fontisto
          name="hashtag"
          size={scaleWidth(compact ? 16 : 20)}
          color={'#FF9500'}
          style={{ flexShrink: 0 }}
        />
        <Text
          style={{
            fontSize: scaleWidth(compact ? 12 : 14),
            fontWeight: '700',
            color: isLight ? '#333333' : '#eaf4f4',
            letterSpacing: 0.25,
            fontVariant: ['tabular-nums'],
            includeFontPadding: false,
            lineHeight: scaleHeight(compact ? 16 : 18),
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
