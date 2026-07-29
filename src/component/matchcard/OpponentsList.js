import { View, Text, Pressable, ScrollView, Image, StyleSheet } from "react-native"
import { AppIcon } from "../../components/common/AppIcon"
import { UserGroupIcon, CheckmarkCircle01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { useBottomSheet } from "../../context/BottomSheetContext"
import { FadingText } from "../customer/animation/FadingText"
import { fontSize, spacing, iconSize } from "../../theme/typography"
import { getParticipantGameData } from "./participantGameData"
import { sharedStyles } from "./sharedStyleAndInfo"

const TABLET_HEIGHT = 44
const AVATAR_SIZE = 32

const OpponentTablet = ({ opponent, game, isLight, onPress }) => {
  const matchGameName = game?.game?.name?.toLowerCase() || opponent?.theGame || ""
  const gameData = getParticipantGameData(opponent, matchGameName)
  const displayName = gameData.gameUsername || opponent.game_name || "Player"
  const isConfirmed = opponent?.is_confirmed

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tablet,
        {
          backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
          borderColor: isConfirmed ? "#00bf63" : isLight ? "#333333" : "#ffffff",
        },
      ]}
    >
      {opponent.profile_picture ? (
        <Image source={{ uri: opponent.profile_picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: isLight ? "#dadada" : "#444444" }]}>
          <AppIcon icon={UserIcon} size={iconSize.sm} color={isLight ? "#333333" : "#EAEAEA"} />
        </View>
      )}

      <Text
        style={[styles.tabletText, { color: isLight ? "#1a1a1a" : "#ffffff" }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayName}
      </Text>

      {isConfirmed ? (
        <View style={[styles.confirmedMark, { backgroundColor: isLight ? "#ffffff" : "#1a1a1a" }]}>
          <AppIcon icon={CheckmarkCircle01Icon} size={14} color="#00bf63" />
        </View>
      ) : null}
    </Pressable>
  )
}

const OpponentsList = ({ game, isLight, handleConfirmedOpponent }) => {
  const { showOpponentSheet } = useBottomSheet()
  const hasOpponents = game?.participants?.length >= 1
  const isGameActive = !["cancelled", "completed", "expired"].includes(game.status)
  const sectionTitle = game?.participants?.some((p) => p.is_confirmed)
    ? "Your Opponent"
    : "Requested Opponent"

  const openOpponentSheet = (opponent) => {
    showOpponentSheet({
      opponent,
      isConfirmed: opponent?.is_confirmed,
      gameStatus: game.status,
      onConfirm: (confirmedOpponent) => {
        handleConfirmedOpponent(confirmedOpponent.participant_id, game.id)
      },
    })
  }

  if (!hasOpponents && isGameActive) {
    return (
      <View style={styles.section}>
        <View style={[sharedStyles.waitingContainer, styles.waitingContainerSolid, { backgroundColor: isLight ? "#000000" : "#ffffff", borderWidth: 0 }]}>
          <FadingText
            text="WAITING FOR OPPONENT"
            color={isLight ? "#ffffff" : "#000000"}
            fontWeight="bold"
          />
        </View>
      </View>
    )
  }

  if (!hasOpponents) {
    return null
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <AppIcon icon={UserGroupIcon} size={iconSize.sm} color={isLight ? "#333333" : "#ffffff"} />
        <Text style={[styles.sectionTitle, { color: isLight ? "#333333" : "#ffffff" }]}>
          {sectionTitle}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabletsRow}
      >
        {game.participants.map((opponent) => (
          <OpponentTablet
            key={opponent.participant_id || opponent.id}
            opponent={opponent}
            game={game}
            isLight={isLight}
            onPress={() => openOpponentSheet(opponent)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  waitingContainerSolid: {
    borderStyle: 'solid',
  },
  tabletsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xxs,
  },
  tablet: {
    flexDirection: "row",
    alignItems: "center",
    height: TABLET_HEIGHT,
    minWidth: 120,
    maxWidth: 160,
    borderRadius: TABLET_HEIGHT / 2,
    borderWidth: 1.5,
    paddingLeft: 6,
    paddingRight: spacing.md,
    paddingVertical: 6,
    gap: spacing.sm,
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabletText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  confirmedMark: {
    position: "absolute",
    top: -4,
    right: -2,
    borderRadius: 10,
  },
})

export default OpponentsList
