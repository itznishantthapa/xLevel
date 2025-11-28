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

    if (gameMode.includes("blitz") || gameMode.includes("bullet")) {
      return "join_url";
    } else if (gameMode.includes("lone wolf")) {
      return "team_code";
    } else {
      // Team Death Match, WOW, Clash Squad, eFootball Friend Match etc.
      return "room_credentials";
    }
  }

  const credentialType = getCredentialType();
  const isChessGame = credentialType === "join_url";
  const isLoneWolf = credentialType === "team_code";
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
            <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
              Credentials sent successfully. Opponent is joining...
            </Text>
          ) : (
            <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
              {isRoomCredentials ? "Send Room ID & Password" :
                isLoneWolf ? "Send Teamcode" :
                  "Send Join URL"}
            </Text>
          )}

          {isRoomCredentials ? (
            <View style={sharedStyles.inputRow}>
              <View style={sharedStyles.inputWrapper}>
                <View
                  style={[
                    sharedStyles.potInputContainer,
                    { borderColor: isLight ? "#000000" : "#ffffff" }
                  ]}
                >
                  <TextInput
                    style={[sharedStyles.potInput, { color: isLight ? "#333333" : "#ffffff" }]}
                    placeholder={`${game.room_id ? game.room_id : "Room ID"}`}
                    placeholderTextColor={isLight ? "#666666" : "#cccccc"}
                    value={credentials.roomId}
                    onChangeText={credentials.setRoomId}

                  />
                </View>
              </View>

              <View style={sharedStyles.inputWrapper}>
                <View
                  style={[
                    sharedStyles.potInputContainer,
                    { borderColor: isLight ? "#000000" : "#ffffff" }
                  ]}
                >
                  <TextInput
                    style={[sharedStyles.potInput, { color: isLight ? "#333333" : "#ffffff" }]}
                    placeholder={`${game.room_pass ?  game.room_pass : "Room Password"}`}
                    placeholderTextColor={isLight ? "#666666" : "#cccccc"}
                    value={credentials.password}
                    onChangeText={credentials.setPassword}

                  />
                </View>
              </View>
            </View>
          ) : isLoneWolf ? (
            <View style={sharedStyles.inputRow}>
              <View style={sharedStyles.inputWrapper}>
                <View
                  style={[
                    sharedStyles.potInputContainer,
                    { borderColor: isLight ? "#000000" : "#ffffff" }
                  ]}
                >
                  <TextInput
                    style={[sharedStyles.potInput, { color: isLight ? "#333333" : "#ffffff" }]}
                    placeholder={`${game.team_code ?  + game.team_code : "Team Code"}`}
                    placeholderTextColor={isLight ? "#666666" : "#cccccc"}
                    value={credentials.teamCode}
                    onChangeText={credentials.setTeamCode}



                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={sharedStyles.inputRow}>
              <View style={sharedStyles.inputWrapper}>
                <View
                  style={[
                    sharedStyles.potInputContainer,
                    { borderColor: isLight ? "#000000" : "#ffffff" }
                  ]}
                >
                  <TextInput
                    style={[sharedStyles.potInput, { color: isLight ? "#333333" : "#ffffff" }]}
                    placeholder={`${game.join_url ? game.join_url : "Join URL"}`}
                    placeholderTextColor={isLight ? "#666666" : "#cccccc"}
                    value={credentials.joinUrl}
                    onChangeText={credentials.setJoinUrl}

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
            Credentials sent successfully. Opponent is joining...
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
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
          Room ID & Password
        </Text>
        <View style={sharedStyles.inputRow}>
          <View style={sharedStyles.inputWrapper}>
            <Pressable
              onPress={() => copyToClipboard(game.room_id, true)}
              style={[
                sharedStyles.potInputContainer,
                { borderColor: isLight ? "#000000" : "#ffffff" }
              ]}
            >
              <Text style={[{ color: isLight ? "#666666" : "#cccccc", fontSize: scaleWidth(12), marginRight: scaleWidth(8) }]}>ID:</Text>
              <Text style={[{ flex: 1, color: isLight ? "#333333" : "#ffffff", fontWeight: '500' }]}>
                {game.room_id}
              </Text>
              <MaterialIcons name="content-copy" size={scaleWidth(14)} color={isLight ? "#666666" : "#dadada"} />
            </Pressable>
          </View>

          <View style={sharedStyles.inputWrapper}>
            <Pressable
              onPress={() => copyToClipboard(game.room_pass, true)}
              style={[
                sharedStyles.potInputContainer,
                { borderColor: isLight ? "#000000" : "#ffffff" }
              ]}
            >
              <Text style={[{ color: isLight ? "#666666" : "#cccccc", fontSize: scaleWidth(12), marginRight: scaleWidth(8) }]}>Pass:</Text>
              <Text style={[{ flex: 1, color: isLight ? "#333333" : "#ffffff", fontWeight: '500' }]}>
                {game.room_pass}
              </Text>
              <MaterialIcons name="content-copy" size={scaleWidth(14)} color={isLight ? "#666666" : "#dadada"} />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  // Team Code (for Lone Wolf mode)
  if (isLoneWolf && game.team_code  &&  game.status === "in_progress") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
         Teamcode (Copy & Join)
        </Text>
        <View style={sharedStyles.inputRow}>
          <View style={sharedStyles.inputWrapper}>
            <Pressable
              onPress={() => copyToClipboard(game.team_code, true)}
              style={[
                sharedStyles.potInputContainer,
                { borderColor: isLight ? "#000000" : "#ffffff" }
              ]}
            >
              <Text style={[{ color: isLight ? "#666666" : "#cccccc", fontSize: scaleWidth(12), marginRight: scaleWidth(8) }]}>Teamcode:</Text>
              <Text style={[{ flex: 1, color: isLight ? "#333333" : "#ffffff", fontWeight: '500' }]}>
                {game.team_code}
              </Text>
              <MaterialIcons name="content-copy" size={scaleWidth(14)} color={isLight ? "#666666" : "#dadada"} />
            </Pressable>
          </View>
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
        <Text style={[sharedStyles.credentialsGuide, { color: isLight ? "#333333" : "#ffffff" }]}>
         URL (Click & Join)
        </Text>
        <View style={sharedStyles.inputRow}>
          <View style={sharedStyles.inputWrapper}>
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
                { borderColor: isLight ? "#000000" : "#ffffff" }
              ]}
            >
              <Text style={[{ color: isLight ? "#666666" : "#cccccc", fontSize: scaleWidth(12), marginRight: scaleWidth(8) }]}>URL:</Text>
              <Text
                style={[
                  {
                    flex: 1,
                    color: "#00bf63",
                    fontWeight: '500',
                    textDecorationLine: 'underline'
                  }
                ]}
                numberOfLines={1}
              >
                {game.join_url}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  // Waiting for opponent response
  if (game.created_by.role === "customer" && game.status !== "expired" && game.status !== "resolved") {
    return (
      <View style={sharedStyles.credentialsDisplayContainer}>
        <View style={[sharedStyles.waitingContainer, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
          <FadingText
            text={game.status === "in_progress" ? "You are confirmed as opponent !" : "Waiting for the response..."}
            color={isLight ? "#333333" : "#ffffff"}
          />
        </View>
      </View>
    )
  }

  return null
}

export default CredentialsSection