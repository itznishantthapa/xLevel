import { View, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { sharedStyles } from "./sharedStyleAndInfo"
import { scaleHeight, scaleWidth } from "../../utils/scaling"


const StatusDisplay = ({ game, isLight, win_pot, user }) => {
  const getStatusContent = () => {
    const accentColor = "#00bf63"
    const bgColor = isLight ? "#0a0a0a" : "#0a0a0a"

    if (game.is_free){
      return {
        text: "Free Entry",
        color: "#ffffff",
        accentColor: accentColor,
        backgroundColor: bgColor,
      }
    }
    if (game.status === "cancelled" || game.status === "expired" || game.status === "resolved") {
      return {
        text: game.is_free ? "Not Played" : "Refunded",
        color: "#ffffff",
        accentColor: accentColor,
        backgroundColor: bgColor,
      }
    }

    if (game.status !== "completed") {
      return {
        text: "Win",
        amount: `${win_pot}`,
        color: "#ffffff",
        accentColor: accentColor,
        backgroundColor: bgColor,
      }
    }

    if (user.id === game.winner) {
      return {
        text: "won",
        amount: `+${win_pot}`,
        color: "#00bf63",
        accentColor: accentColor,
        amountColor: "#00bf63",
        backgroundColor: bgColor,
      }
    }

    return {
      text: "defeated",
      color: "#ffffff",
      accentColor: accentColor,
      amountColor: "#ffffff",
      backgroundColor: bgColor,
    }
  }

  const status = getStatusContent()
  const clipSize = scaleWidth(14)
  const borderWidth = scaleWidth(2)

  return (
    <View style={{ marginTop: scaleHeight(10) }}>
      {/* Outer container with geometric cuts */}
      <View style={{
        position: 'relative',
      }}>
        {/* Top left corner cut */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: clipSize,
          height: borderWidth,
          backgroundColor: status.accentColor,
        }} />
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: borderWidth,
          height: clipSize,
          backgroundColor: status.accentColor,
        }} />
        
        {/* Top right corner - angled cut effect */}
        <View style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: clipSize * 1.5,
          height: borderWidth,
          backgroundColor: status.accentColor,
        }} />
        <View style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: borderWidth,
          height: clipSize,
          backgroundColor: status.accentColor,
        }} />
        
        {/* Bottom left corner */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: clipSize * 1.5,
          height: borderWidth,
          backgroundColor: status.accentColor,
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: borderWidth,
          height: clipSize,
          backgroundColor: status.accentColor,
        }} />
        
        {/* Bottom right corner */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: clipSize,
          height: borderWidth,
          backgroundColor: status.accentColor,
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: borderWidth,
          height: clipSize,
          backgroundColor: status.accentColor,
        }} />

        {/* Center horizontal accent lines */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: scaleWidth(6),
          height: borderWidth,
          backgroundColor: status.accentColor,
          marginTop: -borderWidth / 2,
        }} />
        <View style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          width: scaleWidth(6),
          height: borderWidth,
          backgroundColor: status.accentColor,
          marginTop: -borderWidth / 2,
        }} />

        {/* Main container */}
        <View style={{
          backgroundColor: status.backgroundColor,
          borderWidth: scaleWidth(1),
          borderColor: status.accentColor + '50',
          paddingVertical: scaleHeight(12),
          paddingHorizontal: scaleWidth(20),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: scaleWidth(10),
          overflow: 'hidden',
        }}>
          {/* Left geometric element */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: scaleWidth(3),
          }}>
            <View style={{
              width: scaleWidth(4),
              height: scaleWidth(4),
              backgroundColor: status.accentColor,
              transform: [{ rotate: '45deg' }],
            }} />
            <View style={{
              width: scaleWidth(16),
              height: borderWidth,
              backgroundColor: status.accentColor,
            }} />
          </View>
          
          <Text 
            style={{
              fontWeight: "900",
              color: status.color,
              fontSize: scaleWidth(15),
              letterSpacing: scaleWidth(1.5),
              textTransform: 'uppercase',
              textShadowColor: status.color,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 1,
              flexShrink: 1,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {status.text}
          </Text>
          
          {status.amount && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleWidth(4), flexShrink: 1 }}>
              <Text 
                style={{
                  color: status.amountColor || status.color,
                  fontWeight: "900",
                  fontSize: scaleWidth(17),
                  letterSpacing: scaleWidth(0.5),
                  textShadowColor: status.amountColor || status.color,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 1,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {status.amount}
              </Text>
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={scaleWidth(16)}
                color={status.amountColor || status.color}
              />
            </View>
          )}
          
          {/* Right geometric element */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: scaleWidth(3),
          }}>
            <View style={{
              width: scaleWidth(16),
              height: borderWidth,
              backgroundColor: status.accentColor,
            }} />
            <View style={{
              width: scaleWidth(4),
              height: scaleWidth(4),
              backgroundColor: status.accentColor,
              transform: [{ rotate: '45deg' }],
            }} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default StatusDisplay
