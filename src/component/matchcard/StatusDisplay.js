import { View, Text } from "react-native"
import { PointsIcon } from "../../components/common/AppIcon"
import { sharedStyles } from "./sharedStyleAndInfo"
import { fontSize, spacing, iconSize } from '../../theme/typography';


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
  const clipSize = fontSize.base
  const borderWidth = spacing.xxs

  return (
    <View style={{ marginTop: fontSize.xs }}>
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
          width: 6,
          height: borderWidth,
          backgroundColor: status.accentColor,
          marginTop: -borderWidth / 2,
        }} />
        <View style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          width: 6,
          height: borderWidth,
          backgroundColor: status.accentColor,
          marginTop: -borderWidth / 2,
        }} />

        {/* Main container */}
        <View style={{
          backgroundColor: status.backgroundColor,
          borderWidth: 1,
          borderColor: status.accentColor + '50',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: fontSize.xs,
          overflow: 'hidden',
        }}>
          {/* Left geometric element */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}>
            <View style={{
              width: spacing.xs,
              height: spacing.xs,
              backgroundColor: status.accentColor,
              transform: [{ rotate: '45deg' }],
            }} />
            <View style={{
              width: spacing.lg,
              height: borderWidth,
              backgroundColor: status.accentColor,
            }} />
          </View>
          
          <Text 
            style={{
              fontWeight: "900",
              color: status.color,
              fontSize: 15,
              letterSpacing: 1.5,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
              <Text 
                style={{
                  color: status.amountColor || status.color,
                  fontWeight: "900",
                  fontSize: 17,
                  letterSpacing: 0.5,
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
              <PointsIcon
                size={iconSize.sm}
                color={status.amountColor || status.color}
              />
            </View>
          )}
          
          {/* Right geometric element */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}>
            <View style={{
              width: spacing.lg,
              height: borderWidth,
              backgroundColor: status.accentColor,
            }} />
            <View style={{
              width: spacing.xs,
              height: spacing.xs,
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
