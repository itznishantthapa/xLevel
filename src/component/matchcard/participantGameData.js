export const getParticipantGameData = (participant, gameNameOverride = "") => {
  const gameName = (gameNameOverride || participant?.theGame || "").toLowerCase()

  switch (gameName) {
    case "chess":
      return {
        showUID: false,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "total_games", label: "Games Played", value: participant?.total_games_played ? `${participant.total_games_played}+` : "0" },
          { key: "rapid_rating", label: "Rapid Rating", value: participant?.rapid_rating || "0" },
          { key: "blitz_rating", label: "Blitz Rating", value: participant?.blitz_rating || "0" },
          { key: "bullet_rating", label: "Bullet Rating", value: participant?.bullet_rating || "0" },
        ],
      }

    case "free fire":
    case "pubg":
      return {
        showUID: true,
        uid: participant?.game_uid || participant?.uid,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "level", label: "Level", value: participant?.level || participant?.game_level || "0" },
        ],
      }

    case "efootball":
      return {
        showUID: true,
        uid: participant?.game_uid || participant?.uid,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "current_division", label: "Current Division", value: participant?.current_division || "0" },
          { key: "highest_division", label: "Highest Division", value: participant?.highest_division || "0" },
          { key: "courtesy_rating", label: "Courtesy Rating", value: participant?.courtesy_rating || "0" },
        ],
      }

    case "mlbb":
      return {
        showUID: true,
        uid: participant?.game_uid || participant?.uid,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "current_rank", label: "Current Rank", value: participant?.current_rank || "N/A", needMoreWidth: true },
          { key: "highest_rank", label: "Highest Rank", value: participant?.highest_rank || "N/A", needMoreWidth: true },
        ],
      }

    case "fc":
      return {
        showUID: false,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "ovr", label: "OVR", value: participant?.ovr || "0" },
          { key: "division", label: "Division", value: participant?.division || "N/A", needMoreWidth: true },
        ],
      }

    default:
      return {
        showUID: true,
        uid: participant?.game_uid || participant?.uid,
        gameUsername: participant?.game_username || participant?.game_name,
        stats: [
          { key: "game_level", label: "Game Level", value: participant?.game_level || participant?.level || "0" },
        ],
      }
  }
}

export const getGameDisplayLabel = (gameName = "") => {
  const name = gameName.toLowerCase()
  if (name === "chess") return "Chess.com"
  if (name.includes("efootball")) return "eFootball"
  if (name.includes("free fire") || name.includes("freefire")) return "Free Fire"
  if (name.includes("pubg")) return "PUBG"
  if (name.includes("mlbb")) return "MLBB"
  if (name === "fc") return "FC"
  return gameName || "Game"
}
