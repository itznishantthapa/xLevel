"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { View, TextInput, Keyboard, Platform, StyleSheet } from "react-native"
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
  DividerLine,
  SectionTitle
} from "../../../component/customer/createGame"

const CreatePubg = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params

  // Reference to TermsAgreement component for shake animation
  const termsRef = useRef(null)

  // PUBG game settings state initialization
  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    match_type: "free", // "free" or "paid"
    fight_type: "1v1",
    // TDM specific
    gun_to_use: "M416",
    grenade: false,
    slide: false,
    mode: "Warehouse",
    // WOW specific
    map_code: "",
    fight_range: "Close",
    entry_fee: "",
    termsAccepted: false,
  })

  // Form validation for PUBG
  const isFormValid = useMemo(() => {
    let baseValid = gameSettings.fight_type !== "" && gameSettings.termsAccepted

    if (game_mode === "Team Death Match") {
      baseValid = baseValid && gameSettings.gun_to_use !== "" && gameSettings.mode !== ""
    } else if (game_mode === "WOW") {
      baseValid = baseValid && gameSettings.map_code !== "" && gameSettings.fight_range !== ""
    }

    if (gameSettings.match_type === "free") {
      return baseValid
    }
    
    return baseValid && gameSettings.entry_fee !== "" && Number.parseFloat(gameSettings.entry_fee) > 0
  }, [gameSettings, game_mode])

  // Calculate winning amount with 10% service fee deduction
  const winningAmount = useMemo(() => {
    const fee = Number.parseFloat(gameSettings.entry_fee) || 0
    return (fee * 2 * 0.9).toFixed(2)
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
  const scrollViewRef = useRef(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true)
        scrollViewRef.current?.scrollTo({
          y: Platform.OS === "ios" ? 300 : 500,
          animated: true,
        })
      },
    )

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false)
        scrollViewRef.current?.scrollTo({
          y: 500,
          animated: true,
        })
      },
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [])

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
    // Validate terms acceptance first and shake if not accepted
    if (!gameSettings.termsAccepted) {
      termsRef.current?.shake();
      return;
    }

    const baseSettings = {
      game: game_id,
      game_mode: gameSettings.game_mode,
      fight_type: gameSettings.fight_type,
      is_free: gameSettings.match_type === "free",
      entry_fee: gameSettings.match_type === "paid" && gameSettings.entry_fee ? Number.parseFloat(gameSettings.entry_fee) : undefined,
    }

    // Add mode-specific settings
    if (game_mode === "Team Death Match") {
      Object.assign(baseSettings, {
        gun_to_use: gameSettings.gun_to_use,
        grenade: gameSettings.grenade,
        slide: gameSettings.slide,
        mode: gameSettings.mode,
      })
    } else if (game_mode === "WOW") {
      Object.assign(baseSettings, {
        map_code: gameSettings.map_code,
        fight_range: gameSettings.fight_range,
      })
    }

    setIsLoading(true)
    try {
      await createMatch(baseSettings)

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

  // Handle map code change specifically
  const handleMapCodeChange = (value) => {
    setGameSettings((prev) => ({
      ...prev,
      map_code: value,
    }))
  }

  return (
    <CreateGameLayout 
      title={`Create PUBG ${game_mode}`}
      isLight={isLight} 
      isLoading={isLoading || isCreateMatchLoading}
      isFormValid={isFormValid}
      onSubmit={handleCreateTournament}
      scrollViewRef={scrollViewRef}
      keyboardVisible={keyboardVisible}
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
        options={["1v1", "2v2", "4v4"]}
        selectedValue={gameSettings.fight_type}
        onSelect={(value) => handleOptionSelect("fight_type", value)}
        isLight={isLight}
      />

      {/* TDM Specific Settings */}
      {game_mode === "Team Death Match" && (
        <>
          {/* Gun Selection */}
          <OptionsSection
            title="Gun to Use"
            options={["M416", "UMP45", "S12K", "Kar98k", "Any"]}
            selectedValue={gameSettings.gun_to_use}
            onSelect={(value) => handleOptionSelect("gun_to_use", value)}
            isLight={isLight}
          />

          {/* Mode Selection */}
          <OptionsSection
            title="Mode"
            options={["Warehouse"]}
            selectedValue={gameSettings.mode}
            onSelect={(value) => handleOptionSelect("mode", value)}
            isLight={isLight}
          />

          {/* Combat Settings */}
          <BooleanOptionsSection
            options={[
              { key: "grenade", label: "Grenade" },
              { key: "slide", label: "Slide" },
            ]}
            currentValues={gameSettings}
            onSelect={handleOptionSelect}
            isLight={isLight}
          />
        </>
      )}

      {/* WOW Specific Settings */}
      {game_mode === "WOW" && (
        <>
          {/* Map Code */}
          <View style={[styles.section, { marginBottom: 10 }]}>
            <SectionTitle title="Map Code" isLight={isLight} />
            <View style={[styles.inputContainer, { borderColor: isLight ? "#000000" : "#ffffff" }]}>
              <TextInput
                style={[styles.input, { color: isLight ? "#333333" : "#ffffff" }]}
                value={gameSettings.map_code}
                onChangeText={handleMapCodeChange}
                placeholder="Enter map code"
                placeholderTextColor={isLight ? "#666666" : "#cccccc"}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Fight Range */}
          <OptionsSection
            title="Fight Range"
            options={["Close", "Medium", "Long", "Mixed"]}
            selectedValue={gameSettings.fight_range}
            onSelect={(value) => handleOptionSelect("fight_range", value)}
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
            handleFeeChange("")
          }
        }}
        isLight={isLight}
        valueKey="value"
      />

      {/* Entry Fee Input - Only show for paid matches */}
      {gameSettings.match_type === "paid" && (
        <EntryFeeInput
          value={gameSettings.entry_fee}
          onChangeText={handleFeeChange}
          winningAmount={winningAmount}
          isLight={isLight}
        />
      )}

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
  section: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
});

export default CreatePubg