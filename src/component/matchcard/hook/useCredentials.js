"use client"

import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-simple-toast"
import * as yup from 'yup'

// Maximum number of times a user can resend credentials
const MAX_RESEND_ATTEMPTS = 2

// Validation schemas
const urlSchema = yup.string()
  .required('Join URL is required')
  .url('Please enter a valid URL')
  .matches(/^https?:\/\//, 'URL must start with http:// or https://')
  .matches(
    /^https?:\/\/(?:www\.)?chess\.com\/(?:live|play)|^https?:\/\/link\.chess\.com\/play\/[a-zA-Z0-9]+/,
    'Only chess.com challenge URLs are allowed'
  )

const teamCodeSchema = yup.string()
  .required('Team code is required')
  .min(1, 'Team code must be at least 1 character')

const roomIdSchema = yup.string()
  .required('Room ID is required')
  .min(1, 'Room ID must be at least 1 character')

const passwordSchema = yup.string()
  .required('Password is required')
  .min(1, 'Password must be at least 1 character')

export const useCredentials = (gameId) => {
  const [roomId, setRoomId] = useState("")
  const [password, setPassword] = useState("")
  const [teamCode, setTeamCode] = useState("")
  const [joinUrl, setJoinUrl] = useState("")
  const [isSent, setIsSent] = useState(false)
  const [showResendInputs, setShowResendInputs] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [error, setError] = useState("")

  // Load resend count from AsyncStorage when component mounts
  useEffect(() => {
    if (!gameId) return

    const loadResendCount = async () => {
      try {
        const storedCount = await AsyncStorage.getItem(`resend_count_${gameId}`)
        if (storedCount !== null) {
          setResendCount(parseInt(storedCount, 10))
        }
      } catch (error) {
        // Silent fail - default to 0
      }
    }

    loadResendCount()
  }, [gameId])

  const resetCredentials = () => {
    setRoomId("")
    setPassword("")
    setTeamCode("")
    setJoinUrl("")
  }

  // Validate credentials based on game mode
  const validateCredentials = async (game) => {
    try {
      const gameMode = game.game?.game_mode?.toLowerCase() || "";
      
      // Chess games (Blitz, Bullet only)
      if (gameMode.includes("blitz") || gameMode.includes("bullet")) {
        await urlSchema.validate(joinUrl.trim());
        return {
          isValid: true,
          payload: {
            challenge_id: game?.id,
            post_type: "provided",
            join_url: joinUrl.trim(),
          }
        };
      } 
      // Lone Wolf mode
      else if (gameMode.includes("lone wolf")) {
        await teamCodeSchema.validate(teamCode.trim());
        return {
          isValid: true,
          payload: {
            challenge_id: game?.id,
            post_type: "provided",
            team_code: teamCode.trim(),
          }
        };
      } 
      // Other games (Room ID & Password) - including eFootball Friend Match
      else {
        await roomIdSchema.validate(roomId.trim());
        await passwordSchema.validate(password.trim());
        return {
          isValid: true,
          payload: {
            challenge_id: game?.id,
            post_type: "provided",
            room_id: roomId.trim(),
            room_pass: password.trim(),
          }
        };
      }
    } catch (validationError) {
      return {
        isValid: false,
        error: validationError.message
      };
    }
  };

  const sendCredentials = async (game, handleSendGameCredentials) => {
    setError("")
    
    // Validate credentials based on game mode
    const validation = await validateCredentials(game);
    
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }
    
    const payload = validation.payload;


    // Update state immediately for UI responsiveness
    setIsSent(true)
    setShowResendInputs(false)
    resetCredentials()

    // Then make the API call
    const status = await handleSendGameCredentials(payload)
    
    if (status !== 204) {
      // If the request fails, reset the state
      setIsSent(false)
      setShowResendInputs(true)
      return false
    }

    // If successful, update the resend count
    await updateResendCount()
    return true
  }

  // Function to update resend count in storage
  const updateResendCount = async () => {
    if (!gameId) return

    const newCount = resendCount + 1
    try {
      await AsyncStorage.setItem(`resend_count_${gameId}`, newCount.toString())
      setResendCount(newCount)
      return newCount
    } catch (error) {
      // Silent fail
      return resendCount
    }
  }

  // Function to show resend button if still allowed
  const handleResend = () => {
    if (resendCount >= MAX_RESEND_ATTEMPTS) {
      Toast.show("Maximum resend attempts reached", Toast.SHORT)
      return
    }
    setShowResendInputs(true)
  }

  return {
    roomId,
    setRoomId,
    password,
    setPassword,
    teamCode,
    setTeamCode,
    joinUrl,
    setJoinUrl,
    isSent,
    setIsSent,
    showResendInputs,
    setShowResendInputs,
    resetCredentials,
    sendCredentials,
    resendCount,
    updateResendCount,
    handleResend,
    error,
    setError,
    MAX_RESEND_ATTEMPTS
  }
}