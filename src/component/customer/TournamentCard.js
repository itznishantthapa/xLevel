import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useAuthStore } from "../../store/authStore"
import Clipboard from "@react-native-clipboard/clipboard"
import Toast from "react-native-simple-toast"
import StampID from "../matchcard/StampID"
import { scaleHeight, scaleWidth } from "../../utils/scaling"

const TournamentCard = ({ game }) => {
  const { user } = useAuthStore()
  const { isLight } = useThemeStore()

  const SCREEN_WIDTH = Dimensions.get('window').width
  const isSmallScreen = SCREEN_WIDTH <= 360



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
        </View>

        {/* Game Info Pills */}
        <View style={styles.gameInfoRow}>
          <View style={[styles.infoPill, !isLight && styles.infoPillDark]}>
            <View style={[
              styles.iconWrapper,
              { backgroundColor: isLight ? '#A855F7' : 'rgba(109, 140, 255, 0.2)' },
              // Add shadow only in light mode
              isLight && {
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 4.5,
              }
            ]}>
              <Ionicons name="game-controller" size={scaleWidth(14)} color={isLight ? '#ffffff' : '#6d8cff'} />
            </View>
            <Text style={[styles.pillText, !isLight && styles.pillTextDark]}>{game.game?.name}</Text>
          </View>
          <View style={[styles.infoPill, !isLight && styles.infoPillDark]}>
            <View style={[
              styles.iconWrapper,
              { backgroundColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)' },
              // Add shadow only in light mode
              isLight && {
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 4.5,
              }
            ]}>
              <Ionicons name="people" size={scaleWidth(14)} color={isLight ? '#ffffff' : '#20c997'} />
            </View>
            <Text style={[styles.pillText, !isLight && styles.pillTextDark]}>{game.game?.game_mode}</Text>
          </View>

          {/* Tournament ID Stamp */}
          <View style={[styles.stampContainer, isSmallScreen && styles.stampContainerSmall]}>
            <StampID gameId={game.id} isLight={isLight} compact={isSmallScreen} />
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
                  <Text style={[styles.perKillAmount, !isLight && styles.perKillAmountDark]}>+{game?.per_kill_point} Points</Text>
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

        {!game?.is_free && game?.entry_fee > 0 ? (
          <View style={styles.bonusInfo}>
            <View style={[styles.entryFeeDisplay, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.entryLabel, !isLight && styles.entryLabelDark]}>Entry</Text>
              <View style={styles.entryAmountContainer}>
                <Text style={[styles.entryAmount, !isLight && styles.entryAmountDark]}>{game.entry_fee} Points</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.bonusInfo}>
            <View style={[styles.entryFeeDisplay, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.entryLabel, !isLight && styles.entryLabelDark]}>Entry</Text>
              <View style={styles.entryAmountContainer}>
                <Text style={[styles.entryAmount, !isLight && styles.entryAmountDark]}>Free</Text>
              </View>
            </View>
          </View>
        )}
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
    borderRadius: 25,
    backgroundColor: "transparent",
    borderWidth: 1.5,
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
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  infoPillDark: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333333",
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  pillTextDark: {
    color: "#ffffff",
  },
  stampContainer: {
    marginLeft: 'auto',
  },
  stampContainerSmall: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: scaleHeight(6),
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
  },
  winnerTakesLabel: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  winnerTakesLabelDark: {
    color: "#ffffff",
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
    backgroundColor: "#4CAF50",
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
