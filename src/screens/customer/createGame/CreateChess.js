"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Keyboard } from "react-native"
import Toast from "react-native-simple-toast"
import { useThemeStore } from "../../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateMatch } from "../../../queries/useMutation/useCreateMatch"

// Import shared components
import {
  CreateGameLayout,
  GameInfoHeader,
  OptionsSection,
  EntryFeeInput,
  TermsAgreement,
  DividerLine
} from "../../../component/customer/createGame"

const CreateChess = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params

  // Reference to TermsAgreement component for shake animation
  const termsRef = useRef(null)

  // Set default time control based on game mode
  const getDefaultTimeControl = () => {
    if (game_mode === 'Blitz') {
      return "3|2min";
    } else {
      // Bullet or other modes
      return "2|1min";
    }
  };

  // Chess game settings state initialization
  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    time_control: getDefaultTimeControl(),
    game_type: "Standard",
    rated: false,
    opponent_color: "Random",
    entry_fee: "",
    termsAccepted: false,
  })

  // Form validation for chess
  const isFormValid = useMemo(() => {
    return gameSettings.time_control !== "" &&
      gameSettings.opponent_color !== "" &&
      gameSettings.game_type !== "" &&
      gameSettings.termsAccepted &&
      gameSettings.entry_fee !== "" && Number.parseFloat(gameSettings.entry_fee) > 0
  }, [gameSettings])

  // Calculate winning amount with 10% service fee deduction
  const winningAmount = useMemo(() => {
    const fee = Number.parseFloat(gameSettings.entry_fee) || 0
    return Math.floor(fee * 2 * 0.9)
  }, [gameSettings.entry_fee])

  // Handle option selection for game settings
  const handleOptionSelect = (key, value) => {
    setGameSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle entry fee change with validation
  const handleFeeChange = (value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGameSettings((prev) => ({
        ...prev,
        entry_fee: value,
      }))
    }
  }

  // Handle terms acceptance toggle
  const handleTermsAccept = () => {
    setGameSettings((prev) => ({
      ...prev,
      termsAccepted: !prev.termsAccepted,
    }))
  }

  // Handle tournament creation
  const [isLoading, setIsLoading] = useState(false)
  // Keyboard handling removed; handled globally by CreateGameLayout

  // Handle navigation to rules
  const handleReadRules = useCallback(() => {
    const allRules = queryClient.getQueryData(["gameRules"])

    if (allRules && Array.isArray(allRules)) {
      const gameRule = allRules.find(
        (rule) => rule.game_name?.toLowerCase() === game_name?.toLowerCase()
      )

      if (gameRule) {
        navigation.navigate("rulesList", {
          game: gameRule,
        })
      } else {
        navigation.navigate("gameRules")
      }
    } else {
      navigation.navigate("gameRules")
    }
  }, [queryClient, game_name, navigation])

  const handleCreateTournament = async () => {
    Keyboard.dismiss()
    // Validate terms acceptance first and shake if not accepted
    if (!gameSettings.termsAccepted) {
      termsRef.current?.shake();
      return;
    }

    const finalSettings = {
      game: game_id,
      game_mode: gameSettings.game_mode,
      time_control: gameSettings.time_control,
      game_type: gameSettings.game_type,
      rated: gameSettings.rated,
      opponent_color: gameSettings.opponent_color,
      is_free: false,
      entry_fee: gameSettings.entry_fee ? Number.parseFloat(gameSettings.entry_fee) : undefined,
    }
    


    setIsLoading(true)
    try {

     
      await createMatch(finalSettings)

      // Add a small delay to ensure cache is updated before navigation
      await new Promise((resolve) => setTimeout(resolve, 300))

      
        navigation.reset({
          index: 1,
          routes: [
            { name: 'customerTabs' },
            { name: 'match' }
          ],
        });
    } catch (error) {
      Toast.show(error?.message || "Failed to create challenge.", Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CreateGameLayout 
      title="Create Chess Game" 
      isLight={isLight} 
      isLoading={isLoading || isCreateMatchLoading}
      isFormValid={isFormValid}
      onSubmit={handleCreateTournament}
    >
      {/* Game Info Display */}
      <GameInfoHeader 
        gameName={game_name} 
        gameMode={game_mode} 
        isLight={isLight} 
      />
      
      <DividerLine isLight={isLight} />

      {/* Time Control Selection */}
      <OptionsSection
        title="Time Control"
        options={game_mode === 'Blitz' 
          ? ["3min", "3|2min", "5min"] 
          : ["1min", "1|1min", "2|1min"]
        }
        selectedValue={gameSettings.time_control}
        onSelect={(value) => handleOptionSelect("time_control", value)}
        isLight={isLight}
      />

      {/* Game Type Selection */}
      <OptionsSection
        title="Game Type"
        options={["Standard", "Chess960", "B/Odds"]}
        selectedValue={gameSettings.game_type}
        onSelect={(value) => handleOptionSelect("game_type", value)}
        isLight={isLight}
      />

      {/* Color Preference */}
      <OptionsSection
        title="Color Preference"
        options={["White", "Black", "Random"]}
        selectedValue={gameSettings.opponent_color}
        onSelect={(value) => handleOptionSelect("opponent_color", value)}
        isLight={isLight}
      />

      {/* Rated Game Toggle */}
      <OptionsSection
        title="Rated Game"
        options={["Yes", "No"]}
        selectedValue={gameSettings.rated ? "Yes" : "No"}
        onSelect={(value) => handleOptionSelect("rated", value === "Yes")}
        isLight={isLight}
      />

      {/* Entry Fee Input */}
      <EntryFeeInput
        value={gameSettings.entry_fee}
        onChangeText={handleFeeChange}
        winningAmount={winningAmount}
        isLight={isLight}
        gameName={game_name}
        gameMode={game_mode}
      />

      <DividerLine isLight={isLight} />
      
      {/* Terms agreement */}
      <TermsAgreement
        ref={termsRef}
        isAccepted={gameSettings.termsAccepted}
        onToggle={handleTermsAccept}
        onReadRules={handleReadRules}
        isLight={isLight}
      />
    </CreateGameLayout>
  )
}

export default CreateChess