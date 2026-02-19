import { View, Text, Pressable, TouchableOpacity, StyleSheet } from "react-native"
import { Entypo, FontAwesome5, Ionicons } from "@expo/vector-icons"
import { scaleHeight, scaleWidth } from "../../utils/scaling"
import { sharedStyles } from "./sharedStyleAndInfo"
import { useBottomSheet } from "../../context/BottomSheetContext"

const GameHeader = ({ game, isLight, isCreator, user, handleDeleteChallenge, handleLeaveChallenge, handleReportUser, forOpenGames }) => {
  const { showConfirmSheet } = useBottomSheet()

  const handleDelete = () => {
    showConfirmSheet({
      title: isCreator ? "Cancel Match?" : "Leave Match?",
      message:
        isCreator
          ? "Are you sure you want to cancelled your match?"
          : "Are you sure you want to leave this match?",
      confirmText: "Confirm",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: () => {
        if (isCreator || game.is_free) {
          handleDeleteChallenge(game?.id)
        } else {
          handleLeaveChallenge(game?.id)
        }
      },
    })
  }

  // Icon configurations with vibrant colors
  const gameIconConfig = {
    backgroundColor: isLight ? '#A855F7' : 'rgba(109, 140, 255, 0.2)',
    iconColor: isLight ? '#ffffff' : '#6d8cff'
  }

  const modeIconConfig = {
    backgroundColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)',
    iconColor: isLight ? '#ffffff' : '#20c997'
  }



  return (
    <View style={sharedStyles.gameInfoHeader}>
      <View style={[sharedStyles.gameInfoItem, !isLight && sharedStyles.gameInfoItemDark]}>
        <View style={[
          sharedStyles.iconContainer, 
          { backgroundColor: gameIconConfig.backgroundColor },
          // Add shadow only in light mode
          isLight && {
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 4.5,
          }
        ]}>
          <Ionicons name="game-controller" size={scaleWidth(14)} color={gameIconConfig.iconColor} />
        </View>
        <Text style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}>
          {game.game?.name || "Game"}
        </Text>
      </View>

      <View style={[sharedStyles.gameInfoItem, !isLight && sharedStyles.gameInfoItemDark]}>
        <View style={[
          sharedStyles.iconContainer, 
          { backgroundColor: modeIconConfig.backgroundColor },
          // Add shadow only in light mode
          isLight && {
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 4.5,
          }
        ]}>
          <Ionicons name="people-outline" size={scaleWidth(14)} color={modeIconConfig.iconColor} />
        </View>
        <Text style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}>
          {game.game?.game_mode || "Mode"}
        </Text>
      </View>
      {/* 
      {!game.isAccepted && game.status !== "cancelled" && game.status !== "expired" && game.status !== "completed" && game.status !== "in_progress"&& ( */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: scaleWidth(20), marginLeft: "auto", paddingRight: forOpenGames ? scaleWidth(10) : 0 }}>
        {
          !game.isAccepted && game.status !== "cancelled" && game.status !== "expired" && game.status !== "completed" && game.status !== "in_progress" && game.status !== "resolved" && !forOpenGames && !game.is_free && (
            <Pressable 
              style={[
                localStyles.cancelButton,
                { backgroundColor: isLight ? '#000000' : '#ffffff' }
              ]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <View style={localStyles.cancelButtonContent}>
                <Entypo name="cross" size={scaleWidth(16)} color={isLight ? "#ffffff" : "#000000"} />
                <Text style={[localStyles.cancelButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>{isCreator ? "Cancel" : "Leave"}</Text>
              </View>
            </Pressable>
          )
        }
        {
          forOpenGames && (
            <TouchableOpacity onPress={() => handleReportUser(game)}>
              <FontAwesome5 name="exclamation-circle" size={scaleWidth(18)} color={isLight ? "#000000" : "#fff"} />
            </TouchableOpacity>
          )
        }



      </View>
      {/* )} */}
    </View>
  )
}

const localStyles = StyleSheet.create({
  cancelButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(9),
    borderRadius: scaleWidth(24),
    minHeight: scaleHeight(36),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(6),
  },
  cancelButtonText: {
    fontSize: scaleWidth(13),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default GameHeader
