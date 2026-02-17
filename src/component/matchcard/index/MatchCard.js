import { Pressable, Text, View } from "react-native"
import GameHeader from "../GameHeader"
import { sharedStyles } from "../sharedStyleAndInfo"
import GameDetails from "../gameDetails/GameDetails"
import CreatorInfo from "../CreatorInfo"
import StatusDisplay from "../StatusDisplay"
import OpponentsList from "../OpponentsList"
import CredentialsSection from "../CredentialsSection"
import ActionButtons from "../ActionButtons"
import StampID from "../StampID"
import { useThemeStore } from "../../../store/themeStore"
import { useAuthStore } from "../../../store/authStore"
import { Time } from "../Time"
import { scaleHeight, scaleWidth } from "../../../utils/scaling"
import SettingInfo from "../SettingInfo"
import { Fontisto, MaterialIcons } from "@expo/vector-icons"
import { StyleSheet } from "react-native"


/**
 * Main MatchCard Component
 * Handles both creator and opponent views based on props
 */
const MatchCard = ({
  game,
  win_pot,
  isCreator = false,
  handleSendGameCredentials,
  handleResultUpload,
  handleAcceptChallengeOnCopy,
  handleDeleteChallenge,
  handleLeaveChallenge,
  handleConfirmedOpponent, // Added handleConfirmedOpponent prop for creator functionality
  handleConfirmChallenge,
  handleReportUser,
  forOpenGames = false,
  handleIssue,
  handleReport
}) => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <View style={[sharedStyles.card, !isLight && sharedStyles.cardDark]}>
      <View style={sharedStyles.cardContent}>
        {/* Game Info Header */}
        <GameHeader
          game={game}
          isLight={isLight}
          isCreator={isCreator}
          user={user}
          handleDeleteChallenge={handleDeleteChallenge}
          handleLeaveChallenge={handleLeaveChallenge}
          handleReportUser={handleReportUser}
          forOpenGames={forOpenGames}
          handleIssue={handleIssue}

        />

        {/* Main Content Columns */}
        <View style={sharedStyles.mainSection}>
          {/* Left Section - Game Details */}
          <View style={sharedStyles.leftSection}>
            <SettingInfo />
            <GameDetails game={game} isLight={isLight} />
          </View>

          {/* Vertical Divider */}
          <View style={[sharedStyles.verticalDivider, !isLight && sharedStyles.verticalDividerDark]} />

          {/* Right Section - Creator/User Info */}
          <View style={sharedStyles.rightSection}>
            <CreatorInfo game={game} isLight={isLight} isCreator={isCreator} user={user} />

            <StatusDisplay game={game} isLight={isLight} win_pot={win_pot} user={user} />
            
            {/* Challenge ID Stamp */}
            <StampID gameId={game.id} isLight={isLight} />
          </View>

        </View>

        {
          forOpenGames ? (
             <Time time={game.created_at} isDark={!isLight} forMatch={true} />
          ) : (
            <View style={localStyles.timeReportContainer}>
              <Time time={game.created_at} isDark={!isLight} forMatch={true} />
              <Pressable 
                style={[
                  localStyles.reportButton,
                  { backgroundColor: isLight ? '#000000' : '#ffffff' }
                ]}
                onPress={() => handleReport?.(game)}
                activeOpacity={0.85}
              >
                <View style={localStyles.reportButtonContent}>
                  <MaterialIcons name="flag" size={scaleWidth(16)} color={isLight ? "#ffffff" : "#000000"} />
                  <Text style={[localStyles.reportButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>Report Match</Text>
                </View>
              </Pressable>
            </View>
          )
        }


        <View
          style={[sharedStyles.buttonLine, { backgroundColor: isLight ? "#e0e0e0" : "rgba(255, 255, 255, 0.1)" }]}
        />

        {isCreator && <OpponentsList game={game} isLight={isLight} handleConfirmedOpponent={handleConfirmedOpponent} />}

        {/* Credentials and Actions */}
        {
          !forOpenGames && (
            <CredentialsSection
              game={game}
              isLight={isLight}
              isCreator={isCreator}
              user={user}
              handleSendGameCredentials={handleSendGameCredentials}
              handleAcceptChallengeOnCopy={handleAcceptChallengeOnCopy}
            />
          )
        }

        <ActionButtons
          game={game}
          isLight={isLight}
          isCreator={isCreator}
          user={user}
          handleResultUpload={handleResultUpload}
          forOpenGames={forOpenGames}
          handleConfirmChallenge={handleConfirmChallenge}
        />

        {/* Bottom Line */}

      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  timeReportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(2),
    gap: scaleWidth(12),
  },
  reportButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(9),
    borderRadius: scaleWidth(24),
    minHeight: scaleHeight(36),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(6),
  },
  reportButtonText: {
    fontSize: scaleWidth(13),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MatchCard
