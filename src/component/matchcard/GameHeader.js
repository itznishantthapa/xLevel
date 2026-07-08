import { View, Text, Pressable, TouchableOpacity, StyleSheet } from "react-native"
import { AppIcon } from "../../components/common/AppIcon"
import { GamepadIcon, UserGroupIcon, Cancel01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { fontSize, spacing, iconSize } from "../../theme/typography"
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
          <AppIcon icon={GamepadIcon} size={iconSize.xs} color={gameIconConfig.iconColor} />
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
          <AppIcon icon={UserGroupIcon} size={iconSize.xs} color={modeIconConfig.iconColor} />
        </View>
        <Text style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}>
          {game.game?.game_mode || "Mode"}
        </Text>
      </View>
      {/* 
      {!game.isAccepted && game.status !== "cancelled" && game.status !== "expired" && game.status !== "completed" && game.status !== "in_progress"&& ( */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, marginLeft: "auto", paddingRight: forOpenGames ? fontSize.xs : 0 }}>
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
                <AppIcon icon={Cancel01Icon} size={iconSize.sm} color={isLight ? "#ffffff" : "#000000"} />
                <Text style={[localStyles.cancelButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>{isCreator ? "Cancel" : "Leave"}</Text>
              </View>
            </Pressable>
          )
        }
        {
          forOpenGames && (
            <TouchableOpacity onPress={() => handleReportUser(game)}>
              <AppIcon icon={AlertCircleIcon} size={iconSize.sm} color={isLight ? "#000000" : "#fff"} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: spacing["2xl"],
    minHeight: 36,
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
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default GameHeader
