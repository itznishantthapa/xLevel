import { View, Text, StyleSheet, Pressable, Image, Dimensions, ActivityIndicator, ScrollView } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import { FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useNetworkStatus } from "../../hooks/useNetworkStatus"

// Store and Context
import { useAuthStore } from "../../store/authStore"
import { useThemeStore } from "../../store/themeStore"
import { useGameProfiles } from "../../queries/useGameProfiles"
import { useNavigation } from "@react-navigation/native"
import { useEffect, useState, useRef } from "react"
import { scaleHeight, scaleWidth } from "../../utils/scaling"
import StampID from "../matchcard/StampID"
import { ShakeText } from "./animation"


const { width } = Dimensions.get("window")

/**
 * Enhanced UpcommingGameCard Component with improved UX and business psychology
 */
const UpcommingGameCard = ({ game, handleConfirmChallenge, forFiller = false }) => {
  const { user } = useAuthStore()
  const { isLight } = useThemeStore()
  const { data: gameProfiles = [] } = useGameProfiles()
  const navigation = useNavigation()
  const [selectedGameTime, setSelectedGameTime] = useState(null)
  const shakeTimeRef = useRef(null)

  const SCREEN_WIDTH = Dimensions.get('window').width
  const isSmallScreen = SCREEN_WIDTH <= 360

 
  


  // Get selected time slot data
  const selectedTimeSlot = game.game_times?.find(slot => slot.id === selectedGameTime)
  
  // Calculate progress percentage for the selected time slot or overall if none selected
  const playersJoined = selectedTimeSlot ? selectedTimeSlot.players_registered : game.player_joined
  const maxPlayers = selectedTimeSlot ? selectedTimeSlot.max_players : game.max_player
  
  const joinedPercentage = Math.min((playersJoined / maxPlayers) * 100, 100)
  const spotsLeft = Math.max(maxPlayers - playersJoined, 0)
  const isAlmostFull = spotsLeft <= Math.ceil(maxPlayers * 0.2) // 20% or less spots remaining

 





  /**
   * Handles join button press with profile and balance validation
   */
  const handleJoinPress = () => {
    // Check if time slot selection is required and validate
    if (game.game_times && game.game_times.length > 0 && !selectedGameTime) {
      shakeTimeRef.current?.shake()
      return
    }

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



    handleConfirmChallenge(game, selectedGameTime)
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
                    game?.prize && (
                      <View style={styles.winnerTakesContainer}>
                        <Text style={[styles.winnerTakesLabel, !isLight && styles.winnerTakesLabelDark]}>{game?.prize}</Text>
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
            {/* Date Display */}
            {game?.game_date && (
              <View style={[
                styles.dateDisplay,
                { backgroundColor: isLight ? '#e9ecef' : 'rgba(255, 255, 255, 0.1)' }
              ]}>
                <Ionicons name="calendar-outline" size={14} color={isLight ? '#666666' : '#cccccc'} />
                <Text style={[styles.dateText, !isLight && styles.dateTextDark]}>
                  {new Date(game.game_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}
            {/* Entry Fee Display */}
            <View style={[
              styles.entryFeeDisplay,
              { backgroundColor: isLight ? '#e9ecef' : 'rgba(255, 255, 255, 0.1)' }
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
        !forFiller && joinedPercentage >= 50 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, !isLight && styles.progressLabelDark]}>
                {playersJoined}/{maxPlayers} Players {selectedTimeSlot ? `(${selectedTimeSlot.time_slot})` : 'Joined'}
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


      {/* Game Times Selection Section */}
      {!forFiller && game.game_times && game.game_times.length > 0 && (
        <View style={[styles.gameTimesSection, !isLight && styles.gameTimesSectionDark]}>
          <ShakeText ref={shakeTimeRef}>
            <Text style={[styles.gameTimesLabel, !isLight && styles.gameTimesLabelDark]}>
              Select Game Time   ({game?.game_times?.length} Tournaments)
            </Text>
          </ShakeText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gameTimesScrollContent}
          >
            {game.game_times.map((timeSlot, index) => (
              <Pressable
                key={timeSlot.id || index}
                style={[
                  styles.gameTimeButton,
                  isLight ? styles.gameTimeButtonLight : styles.gameTimeButtonDark,
                  selectedGameTime === timeSlot.id && styles.gameTimeButtonSelected,
                  selectedGameTime === timeSlot.id && (isLight ? styles.gameTimeButtonSelectedLight : styles.gameTimeButtonSelectedDark),
                  timeSlot.is_full && styles.gameTimeButtonDisabled,
                  timeSlot.user_registered && styles.gameTimeButtonRegistered
                ]}
                onPress={() => {
                  if (timeSlot.user_registered) {
                    navigation.navigate("userTournament")
                  } else if (!timeSlot.is_full) {
                    setSelectedGameTime(timeSlot.id)
                  }
                }}
                disabled={timeSlot.is_full}
              >
                <Ionicons 
                  name={timeSlot.user_registered ? "checkmark-circle" : "time-outline"}
                  size={16} 
                  color={timeSlot.user_registered ? "#ffffff" : timeSlot.is_full ? "#999999" : (selectedGameTime === timeSlot.id ? (isLight ? "#ffffff" : "#000000") : (isLight ? "#666666" : "#cccccc"))} 
                />
                <Text style={[
                  styles.gameTimeText,
                  isLight ? styles.gameTimeTextLight : styles.gameTimeTextDark,
                  selectedGameTime === timeSlot.id && styles.gameTimeTextSelected,
                  selectedGameTime === timeSlot.id && (isLight ? styles.gameTimeTextSelectedLight : styles.gameTimeTextSelectedDark),
                  timeSlot.is_full && styles.gameTimeTextDisabled,
                  timeSlot.user_registered && styles.gameTimeTextRegistered
                ]}>
                  {timeSlot.time_slot}
                </Text>
                {timeSlot.is_full && (
                  <Text style={styles.fullBadge}>Full</Text>
                )}
                {timeSlot.user_registered && (
                  <Text style={styles.registeredBadge}>Registered</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filler Message Section */}
      {forFiller && (
        <View style={styles.bottomSection}>
          <View style={styles.timeInfo}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 }, isLight ? { borderColor: '#000000' } : { borderColor: '#ffffff' }, { padding: 8, borderRadius: 8, marginVertical: 10 }]}>
              <Text style={[{ fontSize: 12, fontWeight: 'bold' }, !isLight && styles.timeTextDark]}>
                See You Soon!
              </Text>
              <MaterialCommunityIcons name="robot-happy-outline" size={16} color={isLight ? "#000000" : "#ffffff"} />
            </View>
          </View>
        </View>
      )}

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



  

 

  // Comprehensive mocked data for design purposes
  const mockedGameData = [
    // Per Kill Game - Almost Full
    {
      id: 1,
      game: {
        id: 1,
        name: "PUBG",
        game_mode: "Erangel",
        game_logo_url: "https://level-esport-matchmaking-bucket.blr1.cdn.digitaloceanspaces.com/game_logos/3_WU8qmjc.png",
      },
      title: "Elite Squad Championship",
      fight_type: "battle_royale",
      entry_fee: 50,
      max_player: 100,
      win_type: "per_kill",
      per_kill_point: 25,
      prize: "Winner Gets 5000 Points",
      player_joined: 15,
      is_free: false,
      game_date: "2026-03-05T00:00:00Z",
      game_times: [
        "9:00 AM",
        "9:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "12:30 PM",
        "1:00 PM",
        "1:30 PM"
      ],

       
    },
    
  ];

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

  // Toggle to use mocked data for design - set to true for design mode
  const USE_MOCKED_DATA = false;
  const displayGames = USE_MOCKED_DATA ? mockedGameData : games;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {
            displayGames.length === 0 ? (
              <Text style={[styles.title, isLight ? { color: "#000000" } : { color: "#EAEAEA" }]}> {'Tournaments'}</Text>

            ) : (
              <Text style={[styles.title, isLight ? { color: "#000000" } : { color: "#EAEAEA" }]}> {'Official Tournaments'}</Text>
            )

          }
          <FontAwesome6 name="fire" size={18} color={isLight? "#000000" : "#ffffff"} />
        </View>
      </View>

      <View style={styles.listContainer}>
        {displayGames.length === 0 ? (
          <UpcommingGameCard key={fillerGameData.id} game={fillerGameData} handleConfirmChallenge={undefined} forFiller={true} />
        ) : (
          displayGames.map((item) => (
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  dateTextDark: {
    color: "#ffffff",
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

  // Game Times Section
  gameTimesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
  },
  gameTimesSectionDark: {
    borderColor: "#333333",
  },
  gameTimesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  gameTimesLabelDark: {
    color: "#ffffff",
  },
  gameTimesScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  gameTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  gameTimeButtonLight: {
    backgroundColor: "transparent",
    borderColor: "#e0e0e0",
  },
  gameTimeButtonDark: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333333",
  },
  gameTimeButtonSelected: {
    borderWidth: 2,
  },
  gameTimeButtonSelectedLight: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  gameTimeButtonSelectedDark: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  gameTimeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  gameTimeTextLight: {
    color: "#666666",
  },
  gameTimeTextDark: {
    color: "#cccccc",
  },
  gameTimeTextSelected: {
    fontWeight: "700",
  },
  gameTimeTextSelectedLight: {
    color: "#ffffff",
  },
  gameTimeTextSelectedDark: {
    color: "#000000",
  },
  gameTimeButtonDisabled: {
    opacity: 0.5,
  },
  gameTimeTextDisabled: {
    color: "#999999",
  },
  gameTimeButtonRegistered: {
    backgroundColor: "#00bf63",
    borderColor: "#00bf63",
  },
  gameTimeTextRegistered: {
    color: "#ffffff",
    fontWeight: "700",
  },
  fullBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ff6b6b",
    marginLeft: 4,
  },
  registeredBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 4,
  },
})

export { UpcommingGameCard }
export default UpcommingList
