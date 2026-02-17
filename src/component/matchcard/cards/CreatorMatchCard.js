import MatchCard from "../index/MatchCard"


const CreatorMatchCard = ({
  game,
  win_pot,
  handleSendGameCredentials,
  handleResultUpload,
  handleDeleteChallenge,
  handleConfirmedOpponent,
  handleIssue,
  handleReport
}) => {
  return (
    <MatchCard
      game={game}
      win_pot={win_pot}
      isCreator={true}
      handleSendGameCredentials={handleSendGameCredentials}
      handleResultUpload={handleResultUpload}
      handleDeleteChallenge={handleDeleteChallenge}
      handleConfirmedOpponent={handleConfirmedOpponent}
      handleIssue={handleIssue}
      handleReport={handleReport}
    />
  )
}

export default CreatorMatchCard
