import MatchCard from "../index/MatchCard"


const OpenGameCard = ({
  win_pot,
  game,
  handleConfirmChallenge,
  handleReportUser,
  forOpenGames = true,
}) => {

 

  return (
    <MatchCard
    win_pot={win_pot}
    game={game}
    handleConfirmChallenge={handleConfirmChallenge}
    handleReportUser={handleReportUser}
    forOpenGames={forOpenGames}
    />
  )






}

export default OpenGameCard
