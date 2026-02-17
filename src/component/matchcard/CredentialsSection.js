"use client"

import { useState, useEffect } from "react"
import { View, Text, Pressable, TextInput, Linking } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { scaleHeight, scaleWidth } from "../../utils/scaling"
import Clipboard from "@react-native-clipboard/clipboard"
import Toast from "react-native-simple-toast"
import { sharedStyles } from "./sharedStyleAndInfo"
import { useCredentials } from "./hook/useCredentials"
import { FadingText } from "../customer/animation/FadingText"

const CredentialsSection = ({
  game,
  isLight,
  isCreator,
  user,
  handleSendGameCredentials,
  handleAcceptChallengeOnCopy,
}) => {
  const credentials = useCredentials(game?.id)
  const [isOneTimeClick, setIsOneTimeClick] = useState(false)

  // Load isOneTimeClick state from AsyncStorage on mount
  useEffect(() => {
    const loadIsOneTimeClick = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(`accept_click_${game.id}`)
        if (storedValue !== null) {
          setIsOneTimeClick(storedValue === "true")
        }
      } catch (error) {
        // Silently handle error - default to false state
      }
    }
    loadIsOneTimeClick()
  }, [game.id])

  const copyToClipboard = async (text, isCredential = false) => {
    Clipboard.setString(text)
    Toast.show("Copied!", Toast.SHORT)

    // Only send accept challenge API if copying credentials and not creator
    if (isCredential && !isOneTimeClick && !isCreator) {
      const payload = {
        challenge_id: game?.id,
        post_type: "accepted",
      }

      try {
        await AsyncStorage.setItem(`accept_click_${game.id}`, "true")
        setIsOneTimeClick(true)
      } catch (error) {
        // If storage fails, we still want to try the API call
      }

      handleAcceptChallengeOnCopy(payload)
    }
  }

  const handleSendCredential = async () => {
    const response = await credentials.sendCredentials(game, handleSendGameCredentials)
  }

  // Don't show credentials section if match is completed, cancelled, or at least one result is submitted
  if (game.status === "completed" || game.status === "cancelled" || game?.at_least_one_result_submitted) {
    return null
  }

  // Helper function to determine credential type based on game mode
  const getCredentialType = () => {
    const gameMode = game.game?.game_mode?.toLowerCase() || "";
    const gameName = game.game?.name?.toLowerCase() || "";

    if (gameMode.includes("blitz") || gameMode.includes("bullet")) {
      return "join_url";
    } else if (gameMode.includes("lone wolf")) {
      return "team_code";
    } else if (gameName.includes("mlbb")) {
      return "lobby_id"; // MLBB uses lobby ID (stored as team_code in backend)
    } else {
      // Team Death Match, WOW, Clash Squad, eFootball Friend Match etc.
      return "room_credentials";
    }
  }

  const credentialType = getCredentialType();
  const isChessGame = credentialType === "join_url";
  const isLoneWolf = credentialType === "team_code";
  const isMLBB = credentialType === "lobby_id";
  const isRoomCredentials = credentialType === "room_credentials";

  // Creator view - show input fields or sent credentials
  if (isCreator) {
    const shouldShowCredentialsInput =
      game?.participants?.length === 1 &&
      game.status === "in_progress" &&
      ((!credentials.isSent || credentials.showResendInputs) &&
        (game.resend_limit > 0))

    // Check if credentials are already sent
    const hasCredentials = isChessGame ? !!game.join_url :
      isLoneWolf ? !!game.team_code :
        isMLBB ? !!game.lobby_id :
          (!!game.room_id && !!game.room_pass);

    // Show resend button when credentials are sent but resend limit allows
    const shouldShowResendButton =
      credentials.isSent &&
      !credentials.showResendInputs &&
      game.resend_limit > 0 &&
      game?.participants?.length === 1 &&
      game.status === "in_progress";

    if (shouldShowCredentialsInput) {
      return (
        <View style={sharedStyles.credentialsInputContainer}>
          {hasCredentials ? (
            <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#495057" : "#adb5bd" }]}>
              Credentials sent successfully
            </Text>
          ) : (
            <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#495057" : "#adb5bd" }]}>
              {isRoomCredentials ? "Send Room ID & Password" :
                isLoneWolf ? "Send Teamcode" :
                  isMLBB ? "Send Lobby ID" :
                    "Send Join URL"}
            </Text>
          )}

          {isRoomCredentials ? (
            <View>
              <View
                style={[
                  sharedStyles.potInputContainer,
                  { 
                    borderColor: isLight ? "#000000" : "#ffffff",
                    backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
                  }
                ]}
              >
                <TextInput
                  style={[sharedStyles.potInput, { color: isLight ? "#212529" : "#ffffff" }]}
                  placeholder={`${game.room_id ? game.room_id : "Room ID"}`}
                  placeholderTextColor={isLight ? "#868e96" : "#6c757d"}
                  value={credentials.roomId}
                  onChangeText={credentials.setRoomId}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />
              </View>

              <View
                style={[
                  sharedStyles.potInputContainer,
                  { 
                    borderColor: isLight ? "#000000" : "#ffffff",
                    backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
                  }
                ]}
              >
                <TextInput
                  style={[sharedStyles.potInput, { color: isLight ? "#212529" : "#ffffff" }]}
                  placeholder={`${game.room_pass ?  game.room_pass : "Room Password"}`}
                  placeholderTextColor={isLight ? "#868e96" : "#6c757d"}
                  value={credentials.password}
                  onChangeText={credentials.setPassword}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />
              </View>
            </View>
          ) : isLoneWolf ? (
            <View>
              <View
                style={[
                  sharedStyles.potInputContainer,
                  { 
                    borderColor: isLight ? "#000000" : "#ffffff",
                    backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
                  }
                ]}
              >
                <TextInput
                  style={[sharedStyles.potInput, { color: isLight ? "#212529" : "#ffffff" }]}
                  placeholder={`${game.team_code ? game.team_code : "Team Code"}`}
                  placeholderTextColor={isLight ? "#868e96" : "#6c757d"}
                  value={credentials.teamCode}
                  onChangeText={credentials.setTeamCode}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />
              </View>
            </View>
          ) : isMLBB ? (
            <View>
              <View
                style={[
                  sharedStyles.potInputContainer,
                  { 
                    borderColor: isLight ? "#000000" : "#ffffff",
                    backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
                  }
                ]}
              >
                <TextInput
                  style={[sharedStyles.potInput, { color: isLight ? "#212529" : "#ffffff" }]}
                  placeholder={`${game.lobby_id ? game.lobby_id : "Lobby ID"}`}
                  placeholderTextColor={isLight ? "#868e96" : "#6c757d"}
                  value={credentials.lobbyId}
                  onChangeText={credentials.setLobbyId}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                />
              </View>
            </View>
          ) : (
            <View style={sharedStyles.inputRow}>
              <View style={sharedStyles.inputWrapper}>
                <View
                  style={[
                    sharedStyles.potInputContainer,
                    { 
                      borderColor: isLight ? "#000000" : "#ffffff",
                      backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
                    }
                  ]}
                >
                  <TextInput
                    style={[sharedStyles.potInput, { color: isLight ? "#212529" : "#ffffff" }]}
                    placeholder={`${game.join_url ? game.join_url : "Join URL"}`}
                    placeholderTextColor={isLight ? "#868e96" : "#6c757d"}
                    value={credentials.joinUrl}
                    onChangeText={credentials.setJoinUrl}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                  />
                </View>
              </View>
            </View>
          )}

          {credentials.error ? (
            <Text style={{ color: "#ff0000", marginVertical: 4, textAlign: "center" }}>
              {credentials.error}
            </Text>
          ) : null}

          <Pressable
            style={[
              sharedStyles.sendButton,
              {
                backgroundColor: isLight ? "#000000" : "#eaf4f4",
                marginTop: scaleHeight(12)
              }
            ]}
            onPress={handleSendCredential}
          >
            <View style={sharedStyles.sendButtonContent}>
              <Text style={[sharedStyles.sendButtonText, { color: isLight ? "#ffffff" : "#000000" }]}>
                {game?.resend_limit < 2 ? "Resend Credentials" : "Send Credentials"}
              </Text>
            </View>
          </Pressable>
        </View>
      )
    }

    // Show resend button when credentials are sent successfully
    if (shouldShowResendButton) {
      return (
        <View style={sharedStyles.credentialsInputContainer}>
          <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
            Credentials sent successfully
          </Text>

          <Pressable
            style={[
              sharedStyles.sendButton,
              {
                backgroundColor: isLight ? "#666666" : "#555555",
                marginTop: scaleHeight(12)
              }
            ]}
            onPress={credentials.handleResend}
          >
            <View style={sharedStyles.sendButtonContent}>
              <MaterialIcons
                name="refresh"
                size={scaleWidth(16)}
                color={isLight ? "#ffffff" : "#ffffff"}
                style={{ marginRight: scaleWidth(8) }}
              />
              <Text style={[sharedStyles.sendButtonText, { color: isLight ? "#ffffff" : "#ffffff" }]}>
                Resend Credentials ({credentials.MAX_RESEND_ATTEMPTS - credentials.resendCount} left)
              </Text>
            </View>
          </Pressable>
        </View>
      )
    }




    // if (!game.isAccepted && ((game.room_id && game.room_pass) || game.team_code || credentials.isSent)) {
    //   return (
    //     <View style={sharedStyles.credentialsDisplayContainer}>
    //       <View style={[sharedStyles.waitingContainer, { borderColor: isLight ? "#000000" : "#ffffff", borderStyle: "solid" }]}>
    //         <Text style={[sharedStyles.waitingText, { color: isLight ? "#333333" : "#ffffff" }]}>
    //           Credentials sent successfully. Waiting for opponent...
    //         </Text>
    //       </View>
    //     </View>
    //   )
    // }


    return null
  }

  // Opponent view - show received credentials based on type

  // Room ID and Password (for PUBG TDM, WOW, Clash Squad, eFootball Friend Match, etc.)
  if (isRoomCredentials && game.room_id && game.room_pass &&  game.status === "in_progress") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#495057" : "#adb5bd" }]}>
          Room ID & Password
        </Text>
        <View>
          <Pressable
            onPress={() => copyToClipboard(game.room_id, true)}
            style={[
              sharedStyles.potInputContainer,
              { 
                borderColor: isLight ? "#000000" : "#ffffff",
                backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
              }
            ]}
          >
            <View style={[
              { 
                paddingHorizontal: scaleWidth(8),
                paddingVertical: scaleHeight(4),
                borderRadius: scaleWidth(6),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a",
                marginRight: scaleWidth(10)
              }
            ]}>
              <Text style={[{ color: isLight ? "#495057" : "#adb5bd", fontSize: scaleWidth(10), fontWeight: '700', letterSpacing: 0.5 }]}>ID</Text>
            </View>
            <Text 
              style={[{ flex: 1, color: isLight ? "#212529" : "#ffffff", fontWeight: '600', fontSize: scaleWidth(13) }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {game.room_id}
            </Text>
            <View style={[
              {
                padding: scaleWidth(6),
                borderRadius: scaleWidth(8),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a"
              }
            ]}>
              <MaterialIcons name="content-copy" size={scaleWidth(16)} color={isLight ? "#495057" : "#adb5bd"} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => copyToClipboard(game.room_pass, true)}
            style={[
              sharedStyles.potInputContainer,
              { 
                borderColor: isLight ? "#000000" : "#ffffff",
                backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
              }
            ]}
          >
            <View style={[
              { 
                paddingHorizontal: scaleWidth(8),
                paddingVertical: scaleHeight(4),
                borderRadius: scaleWidth(6),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a",
                marginRight: scaleWidth(10)
              }
            ]}>
              <Text style={[{ color: isLight ? "#495057" : "#adb5bd", fontSize: scaleWidth(10), fontWeight: '700', letterSpacing: 0.5 }]}>PASS</Text>
            </View>
            <Text 
              style={[{ flex: 1, color: isLight ? "#212529" : "#ffffff", fontWeight: '600', fontSize: scaleWidth(13) }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {game.room_pass}
            </Text>
            <View style={[
              {
                padding: scaleWidth(6),
                borderRadius: scaleWidth(8),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a"
              }
            ]}>
              <MaterialIcons name="content-copy" size={scaleWidth(16)} color={isLight ? "#495057" : "#adb5bd"} />
            </View>
          </Pressable>
        </View>
      </View>
    )
  }

  // Team Code (for Lone Wolf mode)
  if (isLoneWolf && game.team_code  &&  game.status === "in_progress") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#495057" : "#adb5bd" }]}>
         Teamcode (Copy & Join)
        </Text>
        <View>
          <Pressable
            onPress={() => copyToClipboard(game.team_code, true)}
            style={[
              sharedStyles.potInputContainer,
              { 
                borderColor: isLight ? "#000000" : "#ffffff",
                backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
              }
            ]}
          >
            <View style={[
              { 
                paddingHorizontal: scaleWidth(8),
                paddingVertical: scaleHeight(4),
                borderRadius: scaleWidth(6),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a",
                marginRight: scaleWidth(10)
              }
            ]}>
              <Text style={[{ color: isLight ? "#495057" : "#adb5bd", fontSize: scaleWidth(10), fontWeight: '700', letterSpacing: 0.5 }]}>CODE</Text>
            </View>
            <Text 
              style={[{ flex: 1, color: isLight ? "#212529" : "#ffffff", fontWeight: '600', fontSize: scaleWidth(13) }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {game.team_code}
            </Text>
            <View style={[
              {
                padding: scaleWidth(6),
                borderRadius: scaleWidth(8),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a"
              }
            ]}>
              <MaterialIcons name="content-copy" size={scaleWidth(16)} color={isLight ? "#495057" : "#adb5bd"} />
            </View>
          </Pressable>
        </View>
      </View>
    )
  }

  // Lobby ID (for MLBB Classic and Brawl modes)
  if (isMLBB && game.lobby_id && game.status === "in_progress") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#495057" : "#adb5bd" }]}>
         Lobby ID (Copy & Join)
        </Text>
        <View>
          <Pressable
            onPress={() => copyToClipboard(game.lobby_id, true)}
            style={[
              sharedStyles.potInputContainer,
              { 
                borderColor: isLight ? "#000000" : "#ffffff",
                backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
              }
            ]}
          >
            <View style={[
              { 
                paddingHorizontal: scaleWidth(8),
                paddingVertical: scaleHeight(4),
                borderRadius: scaleWidth(6),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a",
                marginRight: scaleWidth(10)
              }
            ]}>
              <Text style={[{ color: isLight ? "#495057" : "#adb5bd", fontSize: scaleWidth(10), fontWeight: '700', letterSpacing: 0.5 }]}>LOBBY</Text>
            </View>
            <Text 
              style={[{ flex: 1, color: isLight ? "#212529" : "#ffffff", fontWeight: '600', fontSize: scaleWidth(13) }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {game.lobby_id}
            </Text>
            <View style={[
              {
                padding: scaleWidth(6),
                borderRadius: scaleWidth(8),
                backgroundColor: isLight ? "#e9ecef" : "#2a2a2a"
              }
            ]}>
              <MaterialIcons name="content-copy" size={scaleWidth(16)} color={isLight ? "#495057" : "#adb5bd"} />
            </View>
          </Pressable>
        </View>
      </View>
    )
  }

  // Join URL (for Chess Blitz, Bullet only)
  if (isChessGame && game.join_url && game.status === "in_progress") {
    const handlePressURL = () => {

      // //if game is_accepted is true, then don't open the URL
      // if (game.isAccepted) {
      //   Toast.show("URL Expired", Toast.SHORT);
      //   return;
      // }

      // Open URL
      const url = game.join_url;
      // Check if URL has http/https prefix, add if missing
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

      // Use Linking API to open URL
      Linking.openURL(formattedUrl).then(supported => {
        if (supported) {
          Linking.openURL(formattedUrl);
          handleAcceptChallengeOnCopy({
            challenge_id: game.id,
            post_type: "accepted",
          });
        }  
      }).catch(err => {
        if (__DEV__) {
          console.log('Error opening URL:', err);
        }

       
      });
    };

    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <Text style={[sharedStyles.credentialsGuide, { color: "#00bf63" }]}>
         URL (Click & Join)
        </Text>
        <View>
          <Pressable
            onPress={handlePressURL}
            onLongPress={() => {
              copyToClipboard(game.join_url, true);
              handleAcceptChallengeOnCopy({
                challenge_id: game.id,
                post_type: "accepted",
              });
            }}
            style={[
              sharedStyles.potInputContainer,
              { 
                borderColor: isLight ? "#000000" : "#ffffff",
                backgroundColor: isLight ? "#f8f9fa" : "#1a1a1a"
              }
            ]}
          >
            <View style={[
              { 
                paddingHorizontal: scaleWidth(8),
                paddingVertical: scaleHeight(4),
                borderRadius: scaleWidth(6),
                backgroundColor: "#d1f4e0",
                marginRight: scaleWidth(10)
              }
            ]}>
              <Text style={[{ color: "#00bf63", fontSize: scaleWidth(10), fontWeight: '700', letterSpacing: 0.5 }]}>LINK</Text>
            </View>
            <Text
              style={[
                {
                  flex: 1,
                  color: "#00bf63",
                  fontWeight: '600',
                  fontSize: scaleWidth(12),
                  textDecorationLine: 'underline'
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {game.join_url}
            </Text>
            <View style={[
              {
                padding: scaleWidth(6),
                borderRadius: scaleWidth(8),
                backgroundColor: "#d1f4e0"
              }
            ]}>
              <MaterialIcons name="open-in-new" size={scaleWidth(16)} color="#00bf63" />
            </View>
          </Pressable>
        </View>
      </View>
    )
  }

  // Waiting for opponent response
  if (game.created_by.role === "customer" && game.status !== "expired" && game.status !== "resolved") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <View style={[sharedStyles.waitingContainer, { borderWidth: 0, backgroundColor: isLight ? "#000000" : "#ffffff" }]}>
          <FadingText
            text={game.status === "in_progress" ? "YOU'RE CONFIRMED" : "REQUESTING ..."}
            color={isLight ? "#ffffff" : "#000000"}
            fontWeight="bold"
          />
        </View>
      </View>
    )
  }

  return null
}

export default CredentialsSection