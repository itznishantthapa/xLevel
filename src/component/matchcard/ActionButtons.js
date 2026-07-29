import { View, Text, Pressable, StyleSheet } from "react-native"
import { sharedStyles } from "./sharedStyleAndInfo"
import { AppIcon } from "../../components/common/AppIcon"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { iconSize } from "../../theme/typography"
import CoolButton from "../customer/common/CoolButton"


const ActionButtons = ({ game, isLight, isCreator, user, handleResultUpload, forOpenGames = false, handleConfirmChallenge }) => {

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

  if (game.enableResultPortal && !game.is_free) {
    return (
      <Pressable
        style={[sharedStyles.sendButton, isLight ? { backgroundColor: "#000000" } : { backgroundColor: "#eaf4f4" }, { flexDirection: "row", alignItems: "center", justifyContent: "center",gap:8 }]}
        onPress={() => handleResultUpload(game)}
      >
        <View style={sharedStyles.sendButtonContent}>
        <Text style={[styles.actionButtonText, isLight ? { color: "#ffffff" } : { color: "#000000" }]}>Result</Text>
        </View>
        <AppIcon icon={ArrowRight01Icon} size={iconSize.sm} color={isLight ? "#ffffff" : "#000000"} />
      </Pressable>
    )
  }

  if (forOpenGames) {
    return (
      <Pressable
        style={[
          sharedStyles.sendButton,
          isLight ? { backgroundColor: '#000000' } : { backgroundColor: '#eaf4f4' },
        ]}
        onPress={() => handleConfirmChallenge(game)}
        activeOpacity={0.8}
      >
        <View style={sharedStyles.sendButtonContent}>
          <Text style={[styles.actionButtonText, isLight ? { color: "#ffffff" } : { color: "#000000" }]}>
            JOIN {game.entry_fee ? `${game.entry_fee}` : ""}
          </Text>
        </View>
      </Pressable>
    )
  }

  return null
}

const styles = StyleSheet.create({
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
})


export default ActionButtons
