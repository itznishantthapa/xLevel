import { View, Text, Pressable, Image } from "react-native"
import { Octicons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { scaleWidth } from "../../utils/scaling"

import { sharedStyles } from "./sharedStyleAndInfo"
import { useBottomSheet } from "../../context/BottomSheetContext"
import { FadingText } from "../customer/animation/FadingText"


const OpponentCard = ({ opponent, game, isLight, showOpponentSheet, handleConfirmedOpponent }) => {




  return (
    <Pressable
      style={[
        sharedStyles.opponentBox,
        {
          backgroundColor: isLight ? "transparent" : "#000000",
          borderColor: isLight ? "#000000" : "#ffffff",
        },
        game.status === "in_progress" && {
          borderColor: isLight ? "#000000" : "#ffffff",
          borderWidth: scaleWidth(2),
          backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
        },
      ]}
      onPress={() => {
        showOpponentSheet({
          opponent,
          isConfirmed: opponent?.is_confirmed,
          gameStatus: game.status,
          onConfirm: (confirmedOpponent) => {
            handleConfirmedOpponent(confirmedOpponent.participant_id, game.id)
          },
        })
      }}
    >

      <View style={sharedStyles.opponentContent}>
        {opponent.profile_picture ? (
          <Image source={{ uri: opponent.profile_picture }} style={sharedStyles.opponentAvatar} />
        ) : (
          <View style={[sharedStyles.opponentAvatarFallback, { backgroundColor: isLight ? "#dadada" : "#444444" }]}>
            <Octicons name="feed-person" size={16} color={isLight ? "#333333" : "#EAEAEA"} />
          </View>
        )}
        <View style={sharedStyles.opponentInfo}>
          <View style={sharedStyles.opponentNameRow}>
            <Text style={[sharedStyles.opponentName, { color: isLight ? "#000000" : "#ffffff" }]} numberOfLines={1}>
              {opponent.game_name}
            </Text>
            {opponent?.is_confirmed && (
              <View
                style={[
                  sharedStyles.confirmedBadge,
                  {
                    backgroundColor: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
                    borderColor: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.2)",
                  },
                ]}
              >

                <MaterialCommunityIcons
                  name="check-circle"
                  size={scaleWidth(12)}
                  color={isLight ? "#000000" : "#ffffff"}
                />
                <Text style={[sharedStyles.confirmedText, { color: isLight ? "#000000" : "#ffffff" }]}>Confirmed</Text>
              </View>
            )}
          </View>
          {/* <Text style={[sharedStyles.opponentLevel, { color: isLight ? "#666666" : "#cccccc" }]} numberOfLines={1}>
            Level- {opponent.game_level}
          </Text> */}
        </View>
      </View>

      {!opponent?.is_confirmed && (
        <View style={{ position: "absolute", right: 20, top: "40%" }}>
          <Ionicons name="return-down-back-outline" size={35} color={"black"} />
        </View>
      )}
    </Pressable>
  )
}


const OpponentsList = ({ game, isLight, handleConfirmedOpponent }) => {
  const { showOpponentSheet } = useBottomSheet()
  const hasOpponents = game?.participants?.length >= 1
  const isGameActive = !["cancelled", "completed", "expired"].includes(game.status)

  if (!hasOpponents && isGameActive) {
    return (
      <View style={sharedStyles.opponentsRow}>
        <View style={[sharedStyles.waitingContainer, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
          <FadingText
            text="Waiting for opponents to join..."
            color={isLight ? "#666" : "#ccc"}
          />
        </View>
      </View>
    )
  }

  if (!hasOpponents) {
    return null
  }



  return (
    <>
      <View style={sharedStyles.opponentsSection}>
        <Text style={[sharedStyles.opponentsTitle, { color: isLight ? "#000000" : "#ffffff" }]}>
          {game?.participants?.some((p) => p.is_confirmed) ? "Your Opponent" : "Requested Opponent"}
        </Text>
      </View>
      {game?.participants?.map((opponent) => (
        <OpponentCard
          key={opponent.participant_id || opponent.id}
          opponent={opponent}
          game={game}
          isLight={isLight}
          showOpponentSheet={showOpponentSheet}
          handleConfirmedOpponent={handleConfirmedOpponent}
        />
      ))}
    </>
  )
}

export default OpponentsList
