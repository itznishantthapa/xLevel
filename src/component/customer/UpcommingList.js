import { View, Text, StyleSheet, Pressable, Image, Dimensions, ActivityIndicator } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import { FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useNetworkStatus } from "../../hooks/useNetworkStatus"

// Store and Context
import { useAuthStore } from "../../store/authStore"
import { useThemeStore } from "../../store/themeStore"
import { useGameProfiles } from "../../queries/useGameProfiles"
import { useNavigation } from "@react-navigation/native"
import { useEffect } from "react"
import { scaleHeight, scaleWidth } from "../../utils/scaling"
import StampID from "../matchcard/StampID"


const { width } = Dimensions.get("window")

/**
 * Enhanced UpcommingGameCard Component with improved UX and business psychology
 */
const UpcommingGameCard = ({ game, handleConfirmChallenge, forFiller = false }) => {
  const { user } = useAuthStore()
  const { isLight } = useThemeStore()
  const { data: gameProfiles = [] } = useGameProfiles()
  const navigation = useNavigation()

  const SCREEN_WIDTH = Dimensions.get('window').width
  const isSmallScreen = SCREEN_WIDTH <= 360

 
  


  // Calculate progress percentage for joined players
  const joinedPercentage = Math.min((game.player_joined / game.max_player) * 100, 100)
  const spotsLeft = Math.max(game.max_player - game.player_joined, 0)
  const isAlmostFull = spotsLeft <= Math.ceil(game.max_player * 0.2) // 20% or less spots remaining

 





  /**
   * Handles join button press with profile and balance validation
   */
  const handleJoinPress = () => {
    const existingProfile = gameProfiles.find((profile) => profile.game_id === game.game?.id)

    if (!existingProfile) {
      navigation.navigate("editGameInfo", {
        game: {
          game_id: game.game?.id,
          game_name: game.game?.name,
          game_modes: [game.game?.game_mode],
          game_logo_url: game.game?.game_logo_url
        },
      })

      return
    }



    handleConfirmChallenge(game)
  }

  /**
   * Copies creator's UID to clipboard
   */
  const copyUID = () => {
    try {
      Clipboard.setString(game.created_by?.game_uid || "")

    } catch (error) {

    }
  }

  return (
    <View style={[styles.card, !isLight && styles.cardDark]}>
      {/* Header Section with Title and Status */}
      <View style={[styles.headerSection, !isLight && styles.headerSectionDark]}>
        <View style={styles.titleRow}>
          <Text style={[styles.gameTitle, { marginVertical: forFiller ? 10 : 0 }, !isLight && styles.gameTitleDark]} numberOfLines={1}>
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
              {!forFiller && (
                <View style={[styles.stampContainer, isSmallScreen && styles.stampContainerSmall]}>
                  <StampID gameId={game.id} isLight={isLight} compact={isSmallScreen} />
                </View>
              )}
        </View>
      </View>

      {/* Prize Section - Most Important */}
      <View style={[styles.prizeSection, !isLight && styles.prizeSectionDark]}>
        <View style={styles.mainPrize}>
          {/* Per Kill Reward - Main Focus */}
          <View style={styles.prizeDetails}>
            {
              game.win_type == 'per_kill' ? (
                <View style={styles.prizeDetails}>
                  <View style={styles.perKillContainer}>
                    <Text style={[styles.perKillAmount, !isLight && styles.perKillAmountDark]}>+{game?.per_kill_point} Points</Text>

                    <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}> per kill</Text>
                  </View>
                  {
                    game?.prize ? (
                      <View style={styles.winnerTakesContainer}>
                        <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>{game?.prize}</Text>
                      </View>
                    ) : (
                      <View style={styles.winnerTakesContainer}>
                        <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>Winner Takes Additional 2x Entry Points </Text>
                      </View>
                    )
                  }

                </View>
              ) :
                game.win_type == 'placement' ? (
                  <View style={styles.prizeDetails}>
               
                        <View style={styles.perKillContainer}>
                          <Text style={[styles.perKillAmount, !isLight && styles.perKillAmountDark]}>+{game.top_position_prize} Points </Text>
                          <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}>for top {game.prize_position_upto} players</Text>
                        </View>
                  

                    

                        <View style={styles.winnerTakesContainer}>
                          <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>{game?.prize}</Text>
                        </View>

                    
                  </View>

                ) : (
                  <Text style={[styles.perKillText, !isLight && styles.perKillTextDark]}>MORE GAMES TOMORROW</Text>
                )
            }
          </View>
        </View>
        {!forFiller && (
          <View style={styles.bonusInfo}>
            <View style={[
              styles.entryFeeDisplay,
              { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }
            ]}>
              <Text style={[styles.entryLabel, !isLight && styles.entryLabelDark]}>Entry</Text>
              <View style={styles.entryAmountContainer}>
                <Text style={[styles.entryAmount, !isLight && styles.entryAmountDark]}>
                  {game?.is_free || !game?.entry_fee || game.entry_fee <= 0 ? 'Free' : `${game.entry_fee} Points`}
                </Text>
              </View>
            </View>
          </View>
        )}


      </View>

      {/* Progress and Urgency Section */}

      {
        !forFiller && joinedPercentage > 50 && (
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
        )
      }


      {/* Creator and Time Section */}
      <View style={styles.bottomSection}>

        <View style={styles.timeInfo}>
          {
            forFiller ? (
              <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 }, isLight ? { borderColor: '#000000' } : { borderColor: '#ffffff' }, { padding: 8, borderRadius: 8, marginVertical: 10 }]}>
                <Text style={[{ fontSize: 12, fontWeight: 'bold' }, !isLight && styles.timeTextDark]}>
                  See You Soon!
                </Text>
                <MaterialCommunityIcons name="robot-happy-outline" size={16} color={isLight ? "#000000" : "#ffffff"} />
              </View>

            ) : (
              <Text style={[styles.timeText, !isLight && styles.timeTextDark]}>
                Start Time: {game.start_time}
              </Text>
            )
          }


        </View>
      </View>

      {/* Enhanced Join Button */}

      {
        !forFiller && (
          <Pressable
            style={[
              styles.joinButton,
              isLight ? styles.joinButtonLight : styles.joinButtonDark,
              isAlmostFull && styles.joinButtonUrgent,
            ]}
            onPress={handleJoinPress}
            activeOpacity={0.8}
          >
            <View style={styles.joinButtonContent}>
              <Text style={[styles.joinButtonText, isLight ? { color: "#ffffff" } : { color: "#000000" }]}>
                {game.is_free ? 'Join for Free' : `Join ${game.entry_fee}`}
              </Text>
            </View>
          </Pressable>
        )
      }

    </View>
  )
}

/**
 * Enhanced UpcommingList Component
 */
const UpcommingList = ({ games, handleConfirmChallenge }) => {
  const { isLight } = useThemeStore()
  const { isConnected } = useNetworkStatus()



  const fillerGameData = {
    id: 21,
    game: {
      id: 1,
      name: "Game",
      game_mode: "Mode",
      game_logo_url: "",
    },
    title: "No More Game Available",
    device_type: null,
    fight_type: null,
    entry_fee: 40,
    max_player: 40,
    status: "not_started",
    created_at: "2025-08-19T12:51:03.991905+00:00",
    room_id: null,
    room_pass: null,
    win_type: "kill",
    start_time: "7:30 PM",
    player_joined: 4,
  };



  // Offline: show cached data without a connection-lost component

  if (!games) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00bf63" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {
            games.length === 0 ? (
              <Text style={[styles.title, isLight ? { color: "#000000" } : { color: "#EAEAEA" }]}> {'Tournaments'}</Text>

            ) : (
              <Text style={[styles.title, isLight ? { color: "#000000" } : { color: "#EAEAEA" }]}> {'Official Tournaments'}</Text>
            )

          }
          <FontAwesome6 name="fire" size={18} color={isLight? "#000000" : "#ffffff"} />
        </View>
      </View>

      <View style={styles.listContainer}>
        {games.length === 0 ? (
          <UpcommingGameCard key={fillerGameData.id} game={fillerGameData} handleConfirmChallenge={undefined} forFiller={true} />
        ) : (
          games.map((item) => (
            <UpcommingGameCard key={item.id} game={item} handleConfirmChallenge={handleConfirmChallenge} />
          ))
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  noGamesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noGamesText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  header: {
    marginTop: 0,
    zIndex: 10,
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',

  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Enhanced Card Styles
  card: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: scaleWidth(25),
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
  },
  cardDark: {
    backgroundColor: "#000000",
    borderColor: "#ffffff",
  },

  // Header Section
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
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

  // Prize Section
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
  winnerTakesAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginLeft: 2,
  },
  winnerTakesAmountDark: {
    color: "#cccccc",
  },
  entryAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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

  // Progress Section
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

  // Bottom Section
  bottomSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#16a34a",
    borderWidth: 2,
    borderColor: "#fff",
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

  // Join Button
  joinButton: {
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  joinButtonLight: {
    backgroundColor: "#000000",
  },
  joinButtonDark: {
    backgroundColor: "#eaf4f4",
  },
  joinButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  joinButtonSubtext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  joinButtonFee: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },

  listContainer: {
    flex: 1,
    height: "100%",
  },
})

export { UpcommingGameCard }
export default UpcommingList
