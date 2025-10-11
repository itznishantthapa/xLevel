import { View, Text, Pressable, TouchableOpacity } from "react-native"
import { FontAwesome5, Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons"
import { scaleHeight, scaleWidth } from "../../utils/scaling"
import { sharedStyles } from "./sharedStyleAndInfo"
import PulseAnimation from "../PulseAnimation"
import { useBottomSheet } from "../../context/BottomSheetContext"

const GameHeader = ({ game, isLight, isCreator, user, handleDeleteChallenge, handleLeaveChallenge, handleReportUser, forOpenGames,handleIssue }) => {
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
    backgroundColor: isLight ? '#eef5ff' : 'rgba(46, 81, 255, 0.2)',
    iconColor: isLight ? '#4263eb' : '#6d8cff'
  }

  const modeIconConfig = {
    backgroundColor: isLight ? '#e6f9ee' : 'rgba(18, 184, 134, 0.2)',
    iconColor: isLight ? '#12b886' : '#20c997'
  }



  return (
    <View style={sharedStyles.gameInfoHeader}>
      <View style={[sharedStyles.gameInfoItem, !isLight && sharedStyles.gameInfoItemDark]}>
        <View style={[sharedStyles.iconContainer, { backgroundColor: gameIconConfig.backgroundColor }]}>
          <Ionicons name="game-controller-outline" size={scaleWidth(14)} color={gameIconConfig.iconColor} />
        </View>
        <Text style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}>
          {game.game?.name || "Game"}
        </Text>
      </View>

      <View style={[sharedStyles.gameInfoItem, !isLight && sharedStyles.gameInfoItemDark]}>
        <View style={[sharedStyles.iconContainer, { backgroundColor: modeIconConfig.backgroundColor }]}>
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
          ((game.status === 'in_progress' || game.status === 'not_started' ) && !game.is_free) && (
            <View>
              <PulseAnimation size={scaleWidth(10)} color="#00C851" />
            </View>
          )
        }



        {
          !game.isAccepted && game.status !== "cancelled" && game.status !== "expired" && game.status !== "completed" && game.status !== "in_progress" && game.status !== "resolved" && !forOpenGames && !game.is_free && (
            <Pressable onPress={handleDelete}>
             <Octicons name="diff-removed" size={scaleWidth(18)} color={isLight ? "#000000" : "#fff"} />
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
        {
          game.status === 'in_progress' && !game.is_free ? (
            <TouchableOpacity  onPress={() => handleIssue(game?.id, isCreator, game?.game?.name, game?.game?.game_mode, game)}>
                <FontAwesome5 name="exclamation-circle" size={scaleWidth(18)} color={isLight ? "#000000" : "#fff"} />
            </TouchableOpacity>
          ) : game.status !== "cancelled" && game.is_free && !forOpenGames && game.status !== "completed"  &&  (
             <Pressable onPress={handleDelete}>
              <Octicons name="diff-removed" size={scaleWidth(18)} color={isLight ? "#000000" : "#fff"} />
            </Pressable>
          )
        }


      </View>
      {/* )} */}
    </View>
  )
}

export default GameHeader
