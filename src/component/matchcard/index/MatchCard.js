import { View } from "react-native"
import GameHeader from "../GameHeader"
import { sharedStyles } from "../sharedStyleAndInfo"
import GameDetails from "../gameDetails/GameDetails"
import CreatorInfo from "../CreatorInfo"
import StatusDisplay from "../StatusDisplay"
import OpponentsList from "../OpponentsList"
import CredentialsSection from "../CredentialsSection"
import ActionButtons from "../ActionButtons"
import { useThemeStore } from "../../../store/themeStore"
import { useAuthStore } from "../../../store/authStore"
import { Time } from "../Time"
import { scaleHeight } from "../../../utils/scaling"
import SettingInfo from "../SettingInfo"
import { MaterialIcons } from "@expo/vector-icons"


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
  handleIssue
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
            {/* <View style={{position:'absolute',bottom:scaleHeight(5),right:"40%"}}>
           
            </View> */}
          </View>

        </View>

        {
          forOpenGames && (
            <Time time={game.created_at} isDark={!isLight} />
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

export default MatchCard
