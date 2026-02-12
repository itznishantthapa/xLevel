"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Text, View, StyleSheet, Keyboard } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-simple-toast"

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

const CreateMLBB = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params

  // Reference to TermsAgreement component for shake animation
  const termsRef = useRef(null)

  // Check if it's Brawl mode (simpler settings) or Classic mode (full settings)
  const isBrawlMode = game_mode?.toLowerCase() === "brawl"

  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    match_type: "free", // "free" or "paid"
    fight_type: "1v1",
    // Classic mode only fields
    ...(isBrawlMode ? {} : {
      lane: "Gold",
      hero_class: "Marksman",
    }),
    game_pot: "",
    termsAccepted: false,
  })

  // Language toggle state for terms
  const [isNepaliTerms, setIsNepaliTerms] = useState(false)

  // Hero class options based on selected lane
  const heroClassOptions = useMemo(() => {
    switch (gameSettings.lane) {
      case "EXP":
        return ["Fighter", "Tank"]
      case "Gold":
        return ["Marksman"]
      case "Mid":
        return ["Mage"]
      case "Jungle":
        return ["Assassin", "Fighter"]
      default:
        return ["Marksman"]
    }
  }, [gameSettings.lane])

  // Update hero class when lane changes
  const handleLaneSelect = (lane) => {
    setGameSettings((prev) => {
      const newHeroOptions = (() => {
        switch (lane) {
          case "EXP":
            return ["Fighter", "Tank"]
          case "Gold":
            return ["Marksman"]
          case "Mid":
            return ["Mage"]
          case "Jungle":
            return ["Assassin", "Fighter"]
          default:
            return ["Marksman"]
        }
      })()

      return {
        ...prev,
        lane: lane,
        hero_class: newHeroOptions[0], // Auto-select first available hero class
      }
    })
  }

  const isFormValid = useMemo(() => {
    // Base validation for both modes
    const baseValidation = gameSettings.fight_type !== "" && gameSettings.termsAccepted

    // For Brawl mode - only need fight type and terms
    if (isBrawlMode) {
      if (gameSettings.match_type === "free") {
        return baseValidation
      }
      return baseValidation && gameSettings.game_pot !== "" && Number.parseFloat(gameSettings.game_pot) > 0
    }

    // For Classic mode - also need lane and hero class
    const classicValidation = 
      baseValidation &&
      gameSettings.lane !== "" &&
      gameSettings.hero_class !== ""

    if (gameSettings.match_type === "free") {
      return classicValidation
    }
    
    return classicValidation && gameSettings.game_pot !== "" && Number.parseFloat(gameSettings.game_pot) > 0
  }, [gameSettings, isBrawlMode])

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
      termsRef.current?.shake()
      return
    }

    const finalSettings = {
      game: game_id,
      game_mode: gameSettings.game_mode,
      fight_type: gameSettings.fight_type,
      // Only include lane and hero_class for Classic mode
      ...(isBrawlMode ? {} : {
        lane: gameSettings.lane,
        hero_class: gameSettings.hero_class,
      }),
      is_free: gameSettings.match_type === "free",
      entry_fee: gameSettings.match_type === "paid" && gameSettings.game_pot ? Number.parseFloat(gameSettings.game_pot) : undefined,
    }

    // Remove undefined values from payload
    const payload = Object.fromEntries(Object.entries(finalSettings).filter(([_, value]) => value !== undefined))

    setIsLoading(true)
    try {
      await createMatch(payload)
      // Add a small delay to ensure cache is updated before navigation
      await new Promise((resolve) => setTimeout(resolve, 300))

      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'match' }
        ],
      })
    } catch (error) {
      Toast.show(error?.message || "Failed to create match.", Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CreateGameLayout 
      title="Create MLBB Match" 
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

      {/* Fight Type Selection */}
      <OptionsSection
        title="Fight Type"
        options={["1v1", "2v2", "3v3", "4v4", "5v5"]}
        selectedValue={gameSettings.fight_type}
        onSelect={(value) => handleOptionSelect("fight_type", value)}
        isLight={isLight}
      />

      {/* Classic mode specific options */}
      {!isBrawlMode && (
        <>
          {/* Lane Selection */}
          <OptionsSection
            title="Lane"
            options={["Gold", "EXP", "Jungle", "Mid"]}
            selectedValue={gameSettings.lane}
            onSelect={handleLaneSelect}
            isLight={isLight}
          />

          {/* Hero Class Selection - Filtered based on lane */}
          <OptionsSection
            title="Hero Class"
            options={heroClassOptions}
            selectedValue={gameSettings.hero_class}
            onSelect={(value) => handleOptionSelect("hero_class", value)}
            isLight={isLight}
          />
        </>
      )}

      {/* Match Type Selection */}
      <OptionsSection
        title="Practice With"
        options={[
          { value: "free", label: "Free Entry" },
          { value: "paid", label: "Game Points" }
        ]}
        selectedValue={gameSettings.match_type}
        onSelect={(value) => {
          handleOptionSelect("match_type", value)
          // Clear entry fee when switching to free
          if (value === "free") {
            handlePotChange("")
          }
        }}
        isLight={isLight}
        valueKey="value"
      />

      {/* Free Entry Info Message */}
      {gameSettings.match_type === "free" && (
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: isLight ? "#666666" : "#cccccc" }]}>
            You can create and join up to 5 free entry matches per week.
          </Text>
        </View>
      )}

      {/* Entry Fee Input - Only show for paid matches */}
      {gameSettings.match_type === "paid" && (
        <EntryFeeInput
          value={gameSettings.game_pot}
          onChangeText={handlePotChange}
          winningAmount={winningAmount}
          isLight={isLight}
          gameName={game_name}
          gameMode={game_mode}
        />
      )}

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

const styles = StyleSheet.create({
  infoContainer: {
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
})

export default CreateMLBB
