import MatchCard from "../index/MatchCard"


const CreatorMatchCard = ({
  game,
  win_pot,
  handleSendGameCredentials,
  handleResultUpload,
  handleDeleteChallenge,
  handleConfirmedOpponent,
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
      handleReport={handleReport}
    />
  )
}

export default CreatorMatchCard
