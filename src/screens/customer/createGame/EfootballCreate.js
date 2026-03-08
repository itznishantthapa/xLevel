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
  BooleanOptionsSection,
  EntryFeeInput,
  TermsAgreement,
  DividerLine
} from "../../../component/customer/createGame"

const CreateEFootball = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params

  // Reference to TermsAgreement component for shake animation
  const termsRef = useRef(null)

  // eFootball game settings state initialization
  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    team_type: "Authentic",
    match_type_game: "Standard",
    match_time: 6,
    injuries: true,
    extra_time: true,
    penalties: true,
    substitutions: 3,
    sub_intervals: 3,
    home_condition: "Excellent",
    away_condition: "Excellent",
    entry_fee: "",
    termsAccepted: false,
  })

  // Form validation for eFootball
  const isFormValid = useMemo(() => {
    return gameSettings.team_type !== "" &&
      gameSettings.match_type_game !== "" &&
      gameSettings.home_condition !== "" &&
      gameSettings.away_condition !== "" &&
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
    setGameSettings((prev) => {
      const updates = { [key]: value }
      
      // Auto-set match time to 6 when Authentic team type is selected
      if (key === "team_type" && value === "Authentic") {
        updates.match_time = 6
      }
      // Reset to default 15 when switching back to Dream
      else if (key === "team_type" && value === "Dream" && prev.match_time === 6) {
        updates.match_time = 15
      }
      
      return {
        ...prev,
        ...updates,
      }
    })
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
      team_type: gameSettings.team_type,
      match_type: gameSettings.match_type_game,
      match_time: gameSettings.match_time,
      injuries: gameSettings.injuries,
      extra_time: gameSettings.extra_time,
      penalties: gameSettings.penalties,
      substitutions: gameSettings.substitutions,
      sub_intervals: gameSettings.sub_intervals,
      home_condition: gameSettings.home_condition,
      away_condition: gameSettings.away_condition,
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
      title="Create eFootball Game"
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

      {/* Team Type Selection */}
      <OptionsSection
        title="Team Type"
        options={["Dream", "Authentic"]}
        selectedValue={gameSettings.team_type}
        onSelect={(value) => handleOptionSelect("team_type", value)}
        isLight={isLight}
      />

      {/* Match Type Selection */}
      <OptionsSection
        title="Match Type"
        options={["Standard", "G-Goal"]}
        selectedValue={gameSettings.match_type_game}
        onSelect={(value) => handleOptionSelect("match_type_game", value)}
        isLight={isLight}
      />

      {/* Match Time Selection */}
      <OptionsSection
        title="Match Time"
        options={
          gameSettings.team_type === "Authentic"
            ? [{ value: 6, label: "6 min" }]
            : [
                { value: 5, label: "5 min" },
                { value: 10, label: "10 min" },
                { value: 15, label: "15 min" }
              ]
        }
        selectedValue={gameSettings.match_time}
        onSelect={(value) => handleOptionSelect("match_time", value)}
        isLight={isLight}
        valueKey="value"
      />

      {/* Match Settings */}
      <BooleanOptionsSection
        options={[
          { key: "injuries", label: "Injuries" },
          { key: "extra_time", label: "Extra Time" },
          { key: "penalties", label: "Penalties" },
        ]}
        currentValues={gameSettings}
        onSelect={handleOptionSelect}
        isLight={isLight}
      />

      {/* Substitutions */}
      <OptionsSection
        title="Substitutions"
        options={[0, 1, 2, 3, 4, 5, 6]}
        selectedValue={gameSettings.substitutions}
        onSelect={(value) => handleOptionSelect("substitutions", value)}
        isLight={isLight}
      />

      {/* Sub Intervals */}
      <OptionsSection
        title="Sub Intervals"
        options={[0, 1, 2, 3, 4, 5, 6]}
        selectedValue={gameSettings.sub_intervals}
        onSelect={(value) => handleOptionSelect("sub_intervals", value)}
        isLight={isLight}
      />

      {/* Team Conditions */}
      <OptionsSection
        title="Home Condition"
        options={["Excellent", "Good", "Average", "Poor"]}
        selectedValue={gameSettings.home_condition}
        onSelect={(value) => handleOptionSelect("home_condition", value)}
        isLight={isLight}
      />

      <OptionsSection
        title="Away Condition"
        options={["Excellent", "Good", "Average", "Poor"]}
        selectedValue={gameSettings.away_condition}
        onSelect={(value) => handleOptionSelect("away_condition", value)}
        isLight={isLight}
      />

      {/* Entry Fee Input */}
      <EntryFeeInput
        value={gameSettings.entry_fee}
        onChangeText={handleFeeChange}
        winningAmount={winningAmount}
        isLight={isLight}
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

export default CreateEFootball