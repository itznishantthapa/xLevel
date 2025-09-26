import { View } from "react-native"
import { InfoRow, sharedStyles } from "../sharedStyleAndInfo"


const GameDetails = ({ game, isLight }) => {



  if (game.game.name.toLowerCase().includes("free fire")) {
    const gameMode = game.game?.game_mode;
    return (
      <View style={sharedStyles.gameDetails}>
                <InfoRow
          label="Fight Type"
          value={game.settings.fight_type }
          isDark={!isLight}
          game={game.game}
        />
        <InfoRow
          label="Character Skill"
          value={game.settings.character_skill ? "Yes" : "No"}
          isDark={!isLight}
          gameMode={gameMode}
        />
        <InfoRow label="Headshot" value={game.settings.headshot ? "Yes" : "No"} isDark={!isLight} gameMode={gameMode} />
        <InfoRow label="Limited Ammo" value={game.settings.limited_ammo ? "Yes" : "No"} isDark={!isLight} gameMode={gameMode} />
        <InfoRow label="Round" value={game.settings.round } isDark={!isLight} gameMode={gameMode} />
        <InfoRow label="Gun Attribute" value={game.settings.gun_attribute ? "Yes" : "No"} isDark={!isLight} gameMode={gameMode} />
        <InfoRow label="Default Coins" value={game.settings.default_coin } isDark={!isLight} gameMode={gameMode} />
        <InfoRow label="EP" value={game.settings.ep} isDark={!isLight} gameMode={gameMode} />
        <InfoRow
          label="Device"
          value={game.settings.device_type }
          isDark={!isLight}
          gameMode={gameMode}
          curveOnBottom={true}
        />
      </View>
    )
  }

  if (game.game.name.toLowerCase().includes("pubg")) {

    if (game.game?.game_mode === "Team Death Match") {
      return (
        <View style={sharedStyles.gameDetails}>
          <InfoRow label="Fight Type" value={game.settings.fight_type } isDark={!isLight}  />
          <InfoRow label="Gun to Use" value={game.settings.gun_to_use } isDark={!isLight} />
          <InfoRow label="Grenade Use" value={game.settings.grenade ? "Yes" : "No"} isDark={!isLight} />
          <InfoRow label="Slide" value={game.settings.slide ? "Yes" : "No"} isDark={!isLight} />
          <InfoRow label="Mode" value={game.settings.mode } isDark={!isLight} curveOnBottom={true} />
        </View>
      )
    }


  //   "settings": {
  //     "id": 4,
  //     "fight_type": "1v1",
  //     "gun_to_use": "AR",
  //     "grenade": true,
  //     "slide": true,
  //     "mode": "Classic"
  // },

    if (game.game?.game_mode === "WOW") {
      return (
        <View style={sharedStyles.gameDetails}>
           <InfoRow
          label="Fight Type"
          value={game.settings.fight_type }
          isDark={!isLight}
          game={game.game}
        />
          <InfoRow label="Map Code" value={game.settings.map_code } isDark={!isLight} />
          <InfoRow label="Fight Range" value={game.settings.fight_range } isDark={!isLight} />
        </View>
      )
    }

  }

  if (game.game.name.toLowerCase().includes("efootball")) {
    return (
      <View style={sharedStyles.gameDetails}>

        <InfoRow label="Team Type" value={game.settings.team_type } isDark={!isLight} />
        <InfoRow label="Match Type" value={game.settings.match_type } isDark={!isLight} />
        <InfoRow label="Match Time" value={`${game.settings.match_time } min`} isDark={!isLight} />
        <InfoRow label="Injuries" value={game.settings.injuries ? "Yes" : "No"} isDark={!isLight} />
        <InfoRow label="Extra Time" value={game.settings.extra_time ? "Yes" : "No"} isDark={!isLight} />
        <InfoRow label="Penalties" value={game.settings.penalties ? "Yes" : "No"} isDark={!isLight} />
        <InfoRow label="Substitutions" value={game.settings.substitution } isDark={!isLight} />
        <InfoRow label="Sub Intervals" value={game.settings.sub_interval } isDark={!isLight} />

        <InfoRow
          label="Home Condition"
          value={game.settings.home_condition }
          isDark={!isLight}


        />
        <InfoRow
          label="Away Condition"
          value={game.settings.away_condition }
          isDark={!isLight}
          curveOnBottom={true}
        />
      </View>
    )
  }


  if (game.game.name.toLowerCase().includes("chess")) {
    return (
      <View style={sharedStyles.gameDetails}>

        <InfoRow label="Time Control" value={game.settings.time_control } isDark={!isLight} />
        <InfoRow label="Game Type" value={game.settings.game_type } isDark={!isLight} />
        <InfoRow label="Rated" value={game.settings.rated ? "Yes" : "No"} isDark={!isLight} />
        <InfoRow label="Opponent Color" value={game.settings.opponent_color } isDark={!isLight} />
      
      </View>
    )
  }


}

export default GameDetails
