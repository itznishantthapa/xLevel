import MatchCard from "../index/MatchCard"


const OpponentMatchCard = ({
  game,
  win_pot,
  handleSendGameCredentials,
  handleResultUpload,
  handleAcceptChallengeOnCopy,
  handleDeleteChallenge,
  handleLeaveChallenge,
  handleIssue
}) => {
  return (
    <MatchCard
      game={game}
      win_pot={win_pot}
      isCreator={false}
      handleSendGameCredentials={handleSendGameCredentials}
      handleResultUpload={handleResultUpload}
      handleAcceptChallengeOnCopy={handleAcceptChallengeOnCopy}
      handleDeleteChallenge={handleDeleteChallenge}
      handleLeaveChallenge={handleLeaveChallenge}
      handleIssue={handleIssue}
    />
  )
}

export default OpponentMatchCard
