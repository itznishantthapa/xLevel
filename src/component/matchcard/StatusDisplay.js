import { View, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { sharedStyles } from "./sharedStyleAndInfo"
import { scaleHeight, scaleWidth } from "../../utils/scaling"


const StatusDisplay = ({ game, isLight, win_pot, user }) => {
  const getStatusContent = () => {

    if (game.is_free){
      return {
        text: "Free Entry",
        color: isLight ? "#ffffff" : "#000000",
        backgroundColor: isLight ? "#000000" : "#eaf4f4",
      }
    }
    if (game.status === "cancelled" || game.status === "expired" || game.status === "resolved") {
      return {
        text: game.is_free ? "Not Played" : "Refunded",
        color: isLight ? "#ffffff" : "#000000",
        backgroundColor: isLight ? "#000000" : "#eaf4f4",
      }
    }

    if (game.status !== "completed") {
      return {
        text: "Win Points",
        amount: `${win_pot}`,
        color: isLight ? "#ffffff" : "#000000",
        backgroundColor: isLight ? "#000000" : "#eaf4f4",
      }
    }

    if (user.id === game.winner) {
      return {
        text: "You won",
        amount: `+${win_pot}`,
        color: "#00C851",
        amountColor: isLight ? "#ffffff" : "#000000",
        backgroundColor: isLight ? "#000000" : "#eaf4f4",
      }
    }

    return {
      text: "You're defeated",
      // amount: `-${game.entry_fee}`,
      color: isLight ? "#ffffff" : "#000000",
      amountColor: isLight ? "#ffffff" : "#000000",
      backgroundColor: isLight ? "#000000" : "#eaf4f4",
    }
  }

  const status = getStatusContent()

  return (
    <View style={{ marginTop: scaleHeight(0) }}>
      <View style={[sharedStyles.statusContainer, { backgroundColor: status.backgroundColor }]}>
        <Text style={[{ fontWeight: "bold", color: status.color,  fontSize: scaleWidth(16), }]}>{status.text}</Text>
        {status.amount && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: scaleWidth(2) }}>
            <Text style={{ color: status.amountColor || status.color, fontWeight: "bold", fontSize: scaleWidth(16) }}>{status.amount}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default StatusDisplay
