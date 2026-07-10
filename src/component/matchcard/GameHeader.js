import { View, Text, Pressable, TouchableOpacity, StyleSheet } from "react-native"
import { AppIcon } from "../../components/common/AppIcon"
import { GamepadIcon, UserGroupIcon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { fontSize, spacing, iconSize } from "../../theme/typography"
import { sharedStyles } from "./sharedStyleAndInfo"
import { useBottomSheet } from "../../context/BottomSheetContext"

const GameHeader = ({ game, isLight, isCreator, user, handleDeleteChallenge, handleLeaveChallenge, handleReportUser, forOpenGames }) => {
  const { showGameCreationNotificationSheet } = useBottomSheet()

  const handleDelete = () => {
    showGameCreationNotificationSheet({
      alertTitle: isCreator ? "Cancel Match" : "Leave Match",
      message: isCreator
        ? "Canceling this match will refund your game points instantly and remove it from matches."
        : "Leaving this match will refund your game points instantly.",
      confirmText: "Confirm",
      cancelText: "Cancel",
      isDestructive: true,
      showAlertIcon: false,
      alertTag: "CONFIRMATION",
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
        <Text
          style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}
          numberOfLines={1}
        >
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
        <Text
          style={[sharedStyles.gameInfoText, !isLight && sharedStyles.gameInfoTextDark]}
          numberOfLines={1}
        >
          {game.game?.game_mode || "Mode"}
        </Text>
      </View>

      {
        !game.isAccepted && game.status !== "cancelled" && game.status !== "expired" && game.status !== "completed" && game.status !== "in_progress" && game.status !== "resolved" && !forOpenGames && !game.is_free && (
          <View style={localStyles.headerAction}>
            <Pressable
              style={[
                localStyles.cancelButton,
                isLight ? localStyles.cancelButtonLight : localStyles.cancelButtonDark,
              ]}
              onPress={handleDelete}
            >
              <View
                style={[
                  localStyles.cancelButtonInner,
                  isLight ? localStyles.cancelButtonInnerLight : localStyles.cancelButtonInnerDark,
                ]}
              >
                <Text
                  style={[
                    localStyles.cancelButtonText,
                    isLight ? localStyles.cancelButtonTextLight : localStyles.cancelButtonTextDark,
                  ]}
                  numberOfLines={1}
                >
                  {isCreator ? "Cancel" : "Leave"}
                </Text>
              </View>
            </Pressable>
          </View>
        )
      }
      {
        forOpenGames && (
          <View style={localStyles.headerAction}>
            <TouchableOpacity onPress={() => handleReportUser(game)}>
              <AppIcon icon={AlertCircleIcon} size={iconSize.sm} color={isLight ? "#000000" : "#fff"} />
            </TouchableOpacity>
          </View>
        )
      }
    </View>
  )
}

const localStyles = StyleSheet.create({
  headerAction: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  cancelButton: {
    borderRadius: spacing["2xl"],
    borderWidth: 1.5,
    padding: spacing.xxs,
  },
  cancelButtonLight: {
    borderColor: '#1A1A1A',
  },
  cancelButtonDark: {
    borderColor: '#FFFFFF',
  },
  cancelButtonInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonInnerLight: {
    backgroundColor: '#1A1A1A',
  },
  cancelButtonInnerDark: {
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButtonTextLight: {
    color: '#FFFFFF',
  },
  cancelButtonTextDark: {
    color: '#000000',
  },
});

export default GameHeader
