"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Keyboard } from "react-native"
import Toast from "react-native-simple-toast"
import { useThemeStore } from "../../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateMatch } from "../../../queries/useMutation/useCreateMatch"

import {
  CreateGameLayout,
  GameInfoHeader,
  OptionsSection,
  BooleanOptionsSection,
  EntryFeeInput,
  TermsAgreement,
  DividerLine,
} from "../../../component/customer/createGame"

const MATCH_TYPES = {
  VS_ATTACK: "Vs Attack",
  HEAD_TO_HEAD: "Head to Head",
}

const CreateFC = ({ route }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { mutateAsync: createMatch, isLoading: isCreateMatchLoading } = useCreateMatch()

  const { game_id, game_name, game_mode } = route.params
  const termsRef = useRef(null)

  const [gameSettings, setGameSettings] = useState({
    game_name,
    game_mode,
    match_type: MATCH_TYPES.VS_ATTACK,
    team_type: "My Team",
    extra_time: true,
    penalties: true,
    entry_fee: "",
    termsAccepted: false,
  })

  const isHeadToHead = gameSettings.match_type === MATCH_TYPES.HEAD_TO_HEAD

  const isFormValid = useMemo(() => {
    const hasEntryFee =
      gameSettings.entry_fee !== "" && Number.parseFloat(gameSettings.entry_fee) > 0

    if (!gameSettings.termsAccepted || !hasEntryFee) {
      return false
    }

    if (isHeadToHead) {
      return gameSettings.team_type !== ""
    }

    return true
  }, [gameSettings, isHeadToHead])

  const winningAmount = useMemo(() => {
    const fee = Number.parseFloat(gameSettings.entry_fee) || 0
    return Math.floor(fee * 2 * 0.9)
  }, [gameSettings.entry_fee])

  const handleOptionSelect = (key, value) => {
    setGameSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleFeeChange = (value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setGameSettings((prev) => ({
        ...prev,
        entry_fee: value,
      }))
    }
  }

  const handleTermsAccept = () => {
    setGameSettings((prev) => ({
      ...prev,
      termsAccepted: !prev.termsAccepted,
    }))
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleReadRules = useCallback(() => {
    const allRules = queryClient.getQueryData(["gameRules"])

    if (allRules && Array.isArray(allRules)) {
      const gameRule = allRules.find(
        (rule) => rule.game_name?.toLowerCase() === game_name?.toLowerCase(),
      )

      if (gameRule) {
        navigation.navigate("rulesList", { game: gameRule })
      } else {
        navigation.navigate("gameRules")
      }
    } else {
      navigation.navigate("gameRules")
    }
  }, [queryClient, game_name, navigation])

  const handleCreateMatch = async () => {
    Keyboard.dismiss()

    if (!gameSettings.termsAccepted) {
      termsRef.current?.shake()
      return
    }

    const finalSettings = {
      game: game_id,
      game_mode: gameSettings.game_mode,
      match_type: gameSettings.match_type,
      is_free: false,
      entry_fee: gameSettings.entry_fee
        ? Number.parseFloat(gameSettings.entry_fee)
        : undefined,
    }

    if (isHeadToHead) {
      finalSettings.team_type = gameSettings.team_type
      finalSettings.extra_time = gameSettings.extra_time
      finalSettings.penalties = gameSettings.penalties
    }

    setIsLoading(true)
    try {
      await createMatch(finalSettings)
      await new Promise((resolve) => setTimeout(resolve, 300))

      navigation.reset({
        index: 1,
        routes: [{ name: "customerTabs" }, { name: "match" }],
      })
    } catch (error) {
      Toast.show(error?.message || "Failed to create challenge.", Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CreateGameLayout
      title="Create FC Game"
      isLight={isLight}
      isLoading={isLoading || isCreateMatchLoading}
      isFormValid={isFormValid}
      onSubmit={handleCreateMatch}
    >
      <GameInfoHeader gameName={game_name} gameMode={game_mode} isLight={isLight} />

      <DividerLine isLight={isLight} />

      <OptionsSection
        title="Match Type"
        options={[MATCH_TYPES.VS_ATTACK, MATCH_TYPES.HEAD_TO_HEAD]}
        selectedValue={gameSettings.match_type}
        onSelect={(value) => handleOptionSelect("match_type", value)}
        isLight={isLight}
      />

      {isHeadToHead && (
        <>
          <OptionsSection
            title="Team Type"
            options={["My Team", "Classic"]}
            selectedValue={gameSettings.team_type}
            onSelect={(value) => handleOptionSelect("team_type", value)}
            isLight={isLight}
          />

          <BooleanOptionsSection
            options={[
              { key: "extra_time", label: "Extra Time" },
              { key: "penalties", label: "Penalty" },
            ]}
            currentValues={gameSettings}
            onSelect={handleOptionSelect}
            isLight={isLight}
          />
        </>
      )}

      <EntryFeeInput
        value={gameSettings.entry_fee}
        onChangeText={handleFeeChange}
        winningAmount={winningAmount}
        isLight={isLight}
      />

      <DividerLine isLight={isLight} />

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

export default CreateFC
