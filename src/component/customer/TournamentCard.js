import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useAuthStore } from "../../store/authStore"
import Clipboard from "@react-native-clipboard/clipboard"
import Toast from "react-native-simple-toast"

const TournamentCard = ({ game }) => {
  const { user } = useAuthStore()
  const { isLight } = useThemeStore()

  const per_kill_amount = (game.entry_fee * 0.8).toFixed(0)

 

  // Calculate progress percentage for joined players
  const joinedPercentage = Math.min((game.player_joined / game.max_player) * 100, 100)
  const spotsLeft = Math.max(game.max_player - game.player_joined, 0)
  const isAlmostFull = spotsLeft <= Math.ceil(game.max_player * 0.2) // 20% or less spots remaining

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Toast.show('Copied!', Toast.SHORT);
  };

  const renderRoomCredentials = () => {
    if (game.status === 'completed') {
      return (
        <View style={[styles.credentialsContainer, { borderColor: isLight ? '#000000' : '#ffffff' }]}>
          <Text style={[styles.credentialsText, { color: isLight ? '#000000' : '#ffffff' }]}>
            Match is Completed
          </Text>
        </View>
      );
    }

    if (game.room_id && game.room_pass) {
      return (
        <View style={styles.gameInfoContainer}>
          {/* Room ID */}
          <Pressable
            style={styles.roomDetail}
            onPress={() => copyToClipboard(game.room_id)}
            activeOpacity={0.7}
          >
            <View style={[styles.roomInfoItem, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={{ color: isLight ? '#666666' : '#dadada' }}>ID</Text>
              <Text style={[styles.roomInfoText, { color: isLight ? '#333333' : '#dadada' }]} numberOfLines={1}>
                {game.room_id}
              </Text>
              <MaterialIcons name="content-copy" size={14} color={isLight ? '#666666' : '#dadada'} />
            </View>
          </Pressable>

          {/* Room Password */}
          <Pressable
            style={styles.roomDetail}
            onPress={() => copyToClipboard(game.room_pass)}
            activeOpacity={0.7}
          >
            <View style={[styles.roomInfoItem, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={{ color: isLight ? '#666666' : '#dadada' }}>Pass</Text>
              <Text style={[styles.roomInfoText, { color: isLight ? '#333333' : '#dadada' }]} numberOfLines={1}>
                {game.room_pass}
              </Text>
              <MaterialIcons name="content-copy" size={14} color={isLight ? '#666666' : '#dadada'} />
            </View>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.credentialsContainer, { borderColor: isLight ? '#000000' : '#ffffff' }]}>
        <Text style={[styles.credentialsText, { color: isLight ? '#000000' : '#ffffff' }]}>
        "Get ID & Pass 5 mins early"
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.card, !isLight && styles.cardDark]}>
      {/* Header Section with Title and Status */}
      <View style={[styles.headerSection, !isLight && styles.headerSectionDark]}>
        <View style={styles.titleRow}>
          <Text style={[styles.gameTitle, !isLight && styles.gameTitleDark]} numberOfLines={1}>
            {game.title}
          </Text>
          <View style={styles.statusBadge}>
            <MaterialIcons name="verified" size={16} color="#00bf63" />
            <Text style={styles.statusText}>OFFICIAL</Text>
          </View>
        </View>

        {/* Game Info Pills */}
        <View style={styles.gameInfoRow}>
          <View style={[styles.infoPill, styles.gamePill]}>
            <Ionicons name="game-controller" size={14} color="#fff" />
            <Text style={styles.pillText}>{game.game?.name}</Text>
          </View>
          <View style={[styles.infoPill, styles.modePill, !isLight && { backgroundColor: '#1a1a1a', borderColor: '#333333' }]}>
            <Ionicons name="people" size={14} color={isLight ? "#666666" : "#ffffff"} />
            <Text style={[styles.pillTextDark, !isLight && styles.pillText]}>{game.game?.game_mode}</Text>
          </View>
        </View>
      </View>

      {/* Prize Section */}
      <View style={[styles.prizeSection, !isLight && styles.prizeSectionDark]}>
        <View style={styles.mainPrize}>
          {/* Per Kill Reward */}
          <View style={styles.prizeDetails}>
            {game.win_type == 'per_kill' ? (
              <View style={styles.prizeDetails}>
                <View style={styles.perKillContainer}>
                  <Text style={[styles.perKillAmount, !isLight && styles.perKillAmountDark]}>+{per_kill_amount} Points</Text>
                  <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}> per kill</Text>
                </View>
                {
                  game?.prize ? (
                    <View style={styles.winnerTakesContainer}>
                      <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>Winner Takes Additional {game?.prize}</Text>
                    </View>
                  ) : (
                    <View style={styles.winnerTakesContainer}>
                      <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>Winner Takes Additional 2x Entry Points </Text>
                    </View>
                  )
                }
              </View>
            ) : game.win_type == 'placement' ? (
              <View style={styles.prizeDetails}>
                <View style={styles.perKillContainer}>
                  <Text style={[styles.perKillAmount, !isLight && styles.perKillAmountDark]}>+{game.top_position_prize} Points </Text>
                  <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}>for top {game.prize_position_upto} players</Text>
                </View>
                <View style={styles.winnerTakesContainer}>
                  <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>Winner Takes Additional {game?.prize}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}>MORE GAMES TOMORROW</Text>
            )}
          </View>
        </View>

        <View style={styles.bonusInfo}>
          <View style={[styles.entryFeeDisplay, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.entryLabel, !isLight && styles.entryLabelDark]}>Entry</Text>
            <View style={styles.entryAmountContainer}>
              <Text style={[styles.entryAmount, !isLight && styles.entryAmountDark]}>{game.entry_fee} Points</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, !isLight && styles.progressLabelDark]}>
            {game.player_joined}/{game.max_player} Players Joined
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${joinedPercentage}%` },
                isAlmostFull && styles.progressBarFillRed,
              ]}
            />
          </View>
        </View>
      </View>

      {/* Time Section */}
      <View style={styles.bottomSection}>
        <View style={styles.timeInfo}>
          <Text style={[styles.timeText, !isLight && styles.timeTextDark]}>
            Start Time: {game.start_time}
          </Text>
        </View>
      </View>

      {/* Room Credentials Section */}
      {renderRoomCredentials()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Reuse all styles from UpcommingGameCard
  card: {
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#333333",
  },
  cardDark: {
    backgroundColor: "#000000",
    borderColor: "#ffffff",
  },
  headerSection: {
    padding: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    marginRight: 8,
  },
  gameTitleDark: {
    color: "#ffffff",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#00bf63",
    marginLeft: 2,
  },
  gameInfoRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gamePill: {
    backgroundColor: "#1a1a1a",
  },
  modePill: {
    backgroundColor: "#f5f5f5",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  pillTextDark: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginLeft: 6,
  },
  prizeSection: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
  },
  prizeSectionDark: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333333",
  },
  mainPrize: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  prizeDetails: {
    flex: 1,
  },
  perKillContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  perKillAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00bf63",
  },
  perKillAmountDark: {
    color: "#00bf63",
  },
  perKillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00bf63",
  },
  perKillTextDark: {
    color: "#00bf63",
  },
  winnerTakesContainer: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.7,
  },
  winnerTakesLabel: {
    fontSize: 14,
    color: "#666666",
  },
  winnerTakesLabelDark: {
    color: "#cccccc",
  },
  bonusInfo: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  entryFeeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  entryLabel: {
    fontSize: 14,
    color: "#666",
  },
  entryLabelDark: {
    color: "#ccc",
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  entryAmountDark: {
    color: "#fff",
  },
  entryAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  progressLabelDark: {
    color: "#fff",
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00C851",
    borderRadius: 3,
  },
  progressBarFillRed: {
    backgroundColor: "#dc3545",
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeTextDark: {
    color: "#ffffff",
    borderColor: "#ffffff",
  },
  // New styles for room credentials
  gameInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  roomDetail: {
    flex: 1,
  },
  roomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  roomInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  credentialsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  credentialsText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TournamentCard;
