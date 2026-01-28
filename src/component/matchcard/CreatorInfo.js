import { View, Text, Pressable, Image, ImageBackground } from "react-native"
import { Octicons } from "@expo/vector-icons"
import Clipboard from "@react-native-clipboard/clipboard"
import Toast from "react-native-simple-toast"
import { InfoRow, sharedStyles } from "./sharedStyleAndInfo"
import { scaleWidth } from "../../utils/scaling"

const CreatorInfo = ({ game, isLight, isCreator, user }) => {
  const profileBackground = isLight ? "#dadada" : "#444444"
  const iconColor = isLight ? "#333333" : "#EAEAEA"
  const displayLabel = isCreator ? "You" : "Creator"
  const createdBy = game?.created_by
  const gameName = game?.game?.name?.toLowerCase()

  const copyToClipboard = (text) => {
    if (text) {
      Clipboard.setString(text)
      Toast.show("Copied!", Toast.SHORT)
    }
  }

  const getGameData = () => {
    switch (gameName) {
      case "chess":
        return {
          showUID: false,
          gameUsername: createdBy?.game_username,
          stats: [
            { key: "total_games", label: "Games Played", value: createdBy?.total_games_played + "+" || 0 },
            { key: "rapid_rating", label: "Rapid Rating", value: createdBy?.rapid_rating || 0 },
            { key: "blitz_rating", label: "Blitz Rating", value: createdBy?.blitz_rating || 0 },
            { key: "bullet_rating", label: "Bullet Rating", value: createdBy?.bullet_rating || 0 },
          ].filter((stat) => stat.value),
        }

      case "free fire":
      case "pubg":
        return {
          showUID: true,
          uid: createdBy?.game_uid,
          gameUsername: createdBy?.game_username,
          stats: [
            { key: "level", label: "Level", value: createdBy?.level || createdBy?.game_level || 0 },
          ].filter((stat) => stat.value),
        }

      case "efootball":
        return {
          showUID: true,
          uid: createdBy?.game_uid,
          gameUsername: createdBy?.game_username,
          stats: [
            { key: "current_division", label: "Current Division", value: createdBy?.current_division || 0 },
            { key: "highest_division", label: "Highest Division", value: createdBy?.highest_division || 0 },
            { key: "courtesy_rating", label: "Courtesy Rating", value: createdBy?.courtesy_rating },
          ].filter((stat) => stat.value),
        }

      default:
        return {
          showUID: true,
          uid: createdBy?.game_uid,
          gameUsername: createdBy?.game_username,
          stats: [
            { key: "game_level", label: "Game Level", value: createdBy?.game_level || 0 },
          ].filter((stat) => stat.value),
        }
    }
  }

  const gameData = getGameData()

  return (
    <>
      {createdBy?.profile_picture && createdBy?.active_exposer ? (
        <ImageBackground 
          source={{ uri: createdBy.profile_picture }} 
          style={[sharedStyles.creatorHeader, !isLight && sharedStyles.creatorHeaderDark]}
          imageStyle={{ 
            borderTopRightRadius: 12, 
            borderTopLeftRadius: 12,
            opacity: 0.2 
          }}
        >
          <View style={{
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
            borderTopRightRadius: 12,
            borderTopLeftRadius: 12,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <View style={sharedStyles.avatarContainer}>
              <Image source={{ uri: createdBy.profile_picture }} style={sharedStyles.creatorAvatar} />
              {
                (createdBy?.active_hacker_tag || createdBy?.active_pro_tag) && (
                  <View style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: [{ translateX: -12 }],
                    backgroundColor: isLight ? '#000000' : '#ffffff',
                    paddingHorizontal: scaleWidth(6),
                    paddingVertical: scaleWidth(2),
                    borderRadius: scaleWidth(8),
                    borderWidth: scaleWidth(1),
                    borderColor: isLight ? '#ffffff' : '#000000',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}>
                    <Text style={{
                      color: isLight ? '#ffffff' : '#000000',
                      fontSize: scaleWidth(8),
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>{createdBy?.active_hacker_tag ? 'Hckr' : 'Pro'}</Text>
                  </View>
                )
              }
            </View>

            <View style={sharedStyles.creatorInfo}>
              <Text style={[sharedStyles.creatorName, !isLight && sharedStyles.creatorNameDark]}>
                {createdBy?.full_name?.split(" ")[0]}
              </Text>
              <Text style={[sharedStyles.creatorLabel, !isLight && sharedStyles.creatorLabelDark]}>{displayLabel}</Text>
              {gameData.showUID && gameData.uid && (
                <Pressable onPress={() => copyToClipboard(gameData.uid)}>
                  <Text style={[sharedStyles.gameUID, !isLight && sharedStyles.gameUIDDark, { fontSize: scaleWidth(10) }]}>
                    {gameData.uid}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ImageBackground>
      ) : createdBy?.profile_picture ? (
        <View style={[sharedStyles.creatorHeader, !isLight && sharedStyles.creatorHeaderDark]}>
          <View style={sharedStyles.avatarContainer}>
            <Image source={{ uri: createdBy.profile_picture }} style={sharedStyles.creatorAvatar} />
            {
              (createdBy?.active_hacker_tag || createdBy?.active_pro_tag) && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: [{ translateX: -12 }],
                  backgroundColor: isLight ? '#000000' : '#ffffff',
                  paddingHorizontal: scaleWidth(6),
                  paddingVertical: scaleWidth(2),
                  borderRadius: scaleWidth(8),
                  borderWidth: scaleWidth(1),
                  borderColor: isLight ? '#ffffff' : '#000000',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Text style={{
                    color: isLight ? '#ffffff' : '#000000',
                    fontSize: scaleWidth(8),
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>{createdBy?.active_hacker_tag ? 'Hckr' : 'Pro'}</Text>
                </View>
              )
            }
          </View>

          <View style={sharedStyles.creatorInfo}>
            <Text style={[sharedStyles.creatorName, !isLight && sharedStyles.creatorNameDark]}>
              {createdBy?.full_name?.split(" ")[0]}
            </Text>
            <Text style={[sharedStyles.creatorLabel, !isLight && sharedStyles.creatorLabelDark]}>{displayLabel}</Text>
            {gameData.showUID && gameData.uid && (
              <Pressable onPress={() => copyToClipboard(gameData.uid)}>
                <Text style={[sharedStyles.gameUID, !isLight && sharedStyles.gameUIDDark, { fontSize: scaleWidth(10) }]}>
                  {gameData.uid}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View style={[sharedStyles.creatorHeader, !isLight && sharedStyles.creatorHeaderDark]}>
          <View style={sharedStyles.avatarContainer}>
            <View style={[sharedStyles.profileFallback, { backgroundColor: profileBackground }]}>
              <Octicons name="feed-person" size={scaleWidth(20)} color={iconColor} />
            </View>
            {
              (createdBy?.active_hacker_tag || createdBy?.active_pro_tag) && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: [{ translateX: -12 }],
                  backgroundColor: isLight ? '#000000' : '#ffffff',
                  paddingHorizontal: scaleWidth(6),
                  paddingVertical: scaleWidth(2),
                  borderRadius: scaleWidth(8),
                  borderWidth: scaleWidth(1),
                  borderColor: isLight ? '#ffffff' : '#000000',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Text style={{
                    color: isLight ? '#ffffff' : '#000000',
                    fontSize: scaleWidth(8),
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>{createdBy?.active_hacker_tag ? 'Hckr' : 'Pro'}</Text>
                </View>
              )
            }
          </View>

          <View style={sharedStyles.creatorInfo}>
            <Text style={[sharedStyles.creatorName, !isLight && sharedStyles.creatorNameDark]}>
              {createdBy?.full_name?.split(" ")[0]}
            </Text>
            <Text style={[sharedStyles.creatorLabel, !isLight && sharedStyles.creatorLabelDark]}>{displayLabel}</Text>
            {gameData.showUID && gameData.uid && (
              <Pressable onPress={() => copyToClipboard(gameData.uid)}>
                <Text style={[sharedStyles.gameUID, !isLight && sharedStyles.gameUIDDark, { fontSize: scaleWidth(10) }]}>
                  {gameData.uid}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={sharedStyles.rightInfoContainer}>
        {gameData.gameUsername && (
          <View style={{
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            paddingVertical: scaleWidth(10),
            paddingHorizontal: scaleWidth(14),
            marginBottom: scaleWidth(8),
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)',
          }}>
            <Text 
              style={{
                color: isLight ? '#1a1a1a' : '#f5f5f5',
                fontSize: scaleWidth(14),
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: 0.3,
              }}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {gameData.gameUsername}
            </Text>
          </View>
        )}

        {gameData.stats.map((stat) => (
          <InfoRow
            key={stat.key}
            label={stat.label}
            value={stat.value?.toString() || "0"}
            isDark={!isLight}
            game={game.game}
            isGameInfo={false}
            needMoreWidth={stat.needMoreWidth || false}
          />
        ))}

        {
          !game.is_free && (
            <View style={[{ borderWidth: 2, marginTop: 4 }, { borderColor: isLight ? "#333333" : "#ffffff" }]}>
              <InfoRow
                label="Entry Fee"
                value={`${game.entry_fee}`}
                isDark={!isLight}
                game={game.game}
                needMoreWidth={false}
                isGameInfo={false}
              />
            </View>
          )
        }

      </View>
    </>
  )
}

export default CreatorInfo
