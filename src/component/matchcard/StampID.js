import { Text, View } from "react-native"
import { Fontisto } from "@expo/vector-icons"
import { scaleHeight, scaleWidth } from "../../utils/scaling"

/**
 * StampID Component
 * Displays the challenge/game ID in a stamp sticker style
 */
const StampID = ({ gameId, isLight }) => {
  return (
    <View
      style={{
        marginTop: scaleHeight(12),
        alignSelf: 'center',
        maxWidth: '90%',
        paddingHorizontal: scaleWidth(16),
        paddingVertical: scaleHeight(8),
        borderRadius: scaleWidth(12),
        borderWidth: scaleWidth(2),
        borderColor: isLight ? '#333333' : '#eaf4f4',
        borderStyle: 'dashed',
        backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
        transform: [{ rotate: '-2deg' }],
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
          size={scaleWidth(20)}
          color={'#FF9500'}
          style={{ flexShrink: 0 }}
        />
        <Text
          style={{
            fontSize: scaleWidth(14),
            fontWeight: '700',
            color: isLight ? '#333333' : '#eaf4f4',
            letterSpacing: 0.5,
            flexShrink: 1,
          }}
          numberOfLines={2}
          ellipsizeMode="middle"
        >
          {gameId}
        </Text>
      </View>
    </View>
  )
}

export default StampID
