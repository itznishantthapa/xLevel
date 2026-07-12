"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Keyboard, Platform } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-simple-toast"

import { useCreateMatch } from "../../../queries/useMutation/useCreateMatch"

const getDeviceType = () => (Platform.OS === "ios" ? "iPhone" : "Android")

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

const CreateGame = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params

  // Reference to TermsAgreement component for shake animation
  const termsRef = useRef(null)

  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    fight_type: "1v1",
    limited_ammo: false,
    character_skill_status: false,
    headshot_status: false,
    game_round: 13,
    gun_attribute_status: false,
    game_pot: "",
    default_coins: "500",
    default_ep: "200",
    termsAccepted: false,
  })

  // Language toggle state for terms
  const [isNepaliTerms, setIsNepaliTerms] = useState(false)

  const isFormValid = useMemo(() => {
    const baseValidation = gameSettings.fight_type !== "" && gameSettings.termsAccepted
    
    if (game_mode === "Lone Wolf") {
      return baseValidation && gameSettings.game_pot !== "" && Number.parseFloat(gameSettings.game_pot) > 0
    }

    return baseValidation &&
      gameSettings.game_round !== null &&
      gameSettings.default_coins !== "" &&
      gameSettings.default_ep !== "" &&
      gameSettings.termsAccepted &&
      gameSettings.game_pot !== "" && Number.parseFloat(gameSettings.game_pot) > 0
  }, [gameSettings, game_mode])

  // Calculate winning amount with 10% service fee deduction
  const winningAmount = useMemo(() => {
    const pot = Number.parseFloat(gameSettings.game_pot) || 0
    return Math.floor(pot * 2 * 0.9)
  }, [gameSettings.game_pot])

  // Handle option selection for game settings
  const handleOptionSelect = (key, value) => {
    setGameSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle pot amount change with validation
  const handlePotChange = (value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGameSettings((prev) => ({
        ...prev,
        game_pot: value,
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
      character_skill: gameSettings.character_skill_status,
      headshot: gameSettings.headshot_status,
      limited_ammo: gameSettings.limited_ammo,
      round: gameSettings.game_round?.toString(),
      gun_attribute: gameSettings.gun_attribute_status,
      default_coin: gameSettings.default_coins ? Number.parseInt(gameSettings.default_coins) : undefined,
      ep: gameSettings.default_ep ? Number.parseInt(gameSettings.default_ep) : undefined,
      device_type: getDeviceType(),
      fight_type: gameSettings.fight_type,
      is_free: false,
      entry_fee: gameSettings.game_pot ? Number.parseFloat(gameSettings.game_pot) : undefined,
    }

    // Remove undefined values from payload
    const payload = Object.fromEntries(Object.entries(finalSettings).filter(([_, value]) => value !== undefined))

    setIsLoading(true)
    try {
      await createMatch(payload)      // Add a small delay to ensure cache is updated before navigation
      await new Promise((resolve) => setTimeout(resolve, 300))

             navigation.reset({
          index: 1,
          routes: [
            { name: 'customerTabs' },
            { name: 'match' }
          ],
        });
    } catch (error) {
      Toast.show(error?.message || "Failed to join challenge.", Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CreateGameLayout 
      title="Create Game" 
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

      {/* Game Settings for non-Lone Wolf mode */}
      {game_mode !== "Lone Wolf" ? (
        <>
          {/* Fight Type Selection */}
          <OptionsSection
            title="Fight Type"
            options={["1v1", "2v2", "3v3", "4v4"]}
            selectedValue={gameSettings.fight_type}
            onSelect={(value) => handleOptionSelect("fight_type", value)}
            isLight={isLight}
          />

          {/* Rounds Selection */}
          <OptionsSection
            title="Rounds"
            options={[
              { value: 7, label: "7 Rounds" }, 
              { value: 13, label: "13 Rounds" }
            ]}
            selectedValue={gameSettings.game_round}
            onSelect={(value) => handleOptionSelect("game_round", value)}
            isLight={isLight}
            valueKey="value"
          />

          {/* Game Rules Configuration */}
          <BooleanOptionsSection
            options={[
              { key: "limited_ammo", label: "Limited Ammo" },
              { key: "character_skill_status", label: "Character Skill" },
              { key: "headshot_status", label: "Headshot Only" },
              { key: "gun_attribute_status", label: "Gun Attributes" },
            ]}
            currentValues={gameSettings}
            onSelect={handleOptionSelect}
            isLight={isLight}
          />

          {/* Default Coins Selection */}
          <OptionsSection
            title="Default Coins"
            options={["500", "1500", "9950"]}
            selectedValue={gameSettings.default_coins}
            onSelect={(value) => handleOptionSelect("default_coins", value)}
            isLight={isLight}
          />

          {/* Default EP Selection */}
          <OptionsSection
            title="Default EP"
            options={["0", "50", "200"]}
            selectedValue={gameSettings.default_ep}
            onSelect={(value) => handleOptionSelect("default_ep", value)}
            isLight={isLight}
          />
        </>
      ) : (
        /* Fight Type Selection for Lone Wolf mode */
        <OptionsSection
          title="Fight Type"
          options={["1v1", "2v2"]}
          selectedValue={gameSettings.fight_type}
          onSelect={(value) => handleOptionSelect("fight_type", value)}
          isLight={isLight}
        />
      )}

      {/* Entry Fee Input */}
      <EntryFeeInput
        value={gameSettings.game_pot}
        onChangeText={handlePotChange}
        winningAmount={winningAmount}
        isLight={isLight}
        gameName={game_name}
        gameMode={game_mode}
      />

      {/* Divider line */}
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

export default CreateGame