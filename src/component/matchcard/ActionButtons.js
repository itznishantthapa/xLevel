import { View, Text, Pressable, StyleSheet } from "react-native"
import { sharedStyles } from "./sharedStyleAndInfo"
import { FontAwesome, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons"
import CoolButton from "../customer/common/CoolButton"


const ActionButtons = ({ game, isLight, isCreator, user, handleResultUpload, forOpenGames = false, handleConfirmChallenge }) => {

  const hasCredentials = (game?.room_id && game?.room_pass) || game?.join_url || game?.team_code || game?.lobby_id

  if (game.status === "cancelled") {
    return (
      <View style={[sharedStyles.statusButton, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
        <Text style={[sharedStyles.statusText, { color: isLight ? "#000000" : "#ffffff" }]}>
          {game.cancelled_by === user.id ? "You cancelled this match" : "Opponent cancelled this match"}
        </Text>
      </View>
    )
  }

  if (game.status === "completed") {
    return (
      <View style={[sharedStyles.statusButton, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
        <Text style={[sharedStyles.statusText, { color: isLight ? "#000000" : "#ffffff" }]}>Match is Completed</Text>
      </View>
    )
  }

  if (game.status === "expired") {
    return (
      <View style={[sharedStyles.statusButton, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
        <Text style={[sharedStyles.statusText, { color: isLight ? "#000000" : "#ffffff" }]}>Match is Expired</Text>
      </View>
    )
  }
  
  if (game.status === "resolved") {
    return (
      <View style={[sharedStyles.statusButton, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
        <Text style={[sharedStyles.statusText, { color: isLight ? "#000000" : "#ffffff" }]}>Match is Resolved</Text>
      </View>
    )
  }

  if (hasCredentials && game.status === "in_progress" && !game.is_free) {
    return (
      <Pressable
        style={[sharedStyles.sendButton, isLight ? { backgroundColor: "#000000" } : { backgroundColor: "#eaf4f4" }, { flexDirection: "row", alignItems: "center", justifyContent: "center",gap:8 }]}
        onPress={() => handleResultUpload(game)}
      >
        <View style={sharedStyles.sendButtonContent}>
        <Text style={[styles.joinButtonText, isLight ? { color: "#ffffff" } : { color: "#000000" }]}>Result</Text>
        </View>
        <FontAwesome6 name="angle-right" size={15} color={isLight ? "#ffffff" : "#000000"} />
      </Pressable>
    )
  }

  if (forOpenGames) {
    return (
      <Pressable
        style={[styles.joinButton, isLight ? { backgroundColor: '#000000' } : { backgroundColor: '#eaf4f4' }]}
        onPress={() => handleConfirmChallenge(game)}
        activeOpacity={0.8}
      >
        <View style={styles.joinButtonContent}>
          <Text style={[styles.joinButtonText, isLight ? { color: "#ffffff" } : { color: "#000000" }]}>JOIN {game.entry_fee ? `${game.entry_fee}` : ""}</Text>
        </View>
      </Pressable>

    )
  }

  return null
}

const styles = StyleSheet.create({
  joinButton: {
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  joinButtonContent: {
    alignItems: 'center',
    flexDirection:'row',
    justifyContent:'center',
    gap:4
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },

})


export default ActionButtons
