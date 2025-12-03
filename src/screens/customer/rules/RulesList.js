"use client"

import { StyleSheet, Text, View, ScrollView, Pressable, FlatList, StatusBar } from "react-native"
import { useState, useEffect, useCallback } from "react"
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native"
import { useThemeStore } from "../../../store/themeStore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AppHeader from "../header/AppHeader"
import { useBottomSheet } from "../../../context/BottomSheetContext"

/**
 * RulesList Component
 * Displays the rules for a specific game and its game modes in a minimal, card-based design
 */
const RulesList = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { isLight } = useThemeStore()
  const insets = useSafeAreaInsets()
  const [selectedMode, setSelectedMode] = useState(null)
  const [rules, setRules] = useState([])
  const { checkAndReopenSheet } = useBottomSheet()
  
  // Store if we should return to the bottom sheet
  const returnToJoinSheet = route.params?.returnToJoinSheet || false
  const gameData = route.params?.gameData

  // Get game data from navigation params
  const game = route.params?.game

  // Colors based on theme
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#333333" : "#dadada",
    subText: isLight ? "#000000" : "#ffffff",
    card: isLight ? "transparent" : "#000000",
    cardBorder: isLight ? "#333333" : "#dadada",
    activeTab: isLight ? "#000000" : "#000000",
    inactiveTab: isLight ? "#d9d9d980" : "rgba(255, 255, 255, 0.05)",
    ruleNumber: isLight ? "#000000" : "#ffffff",
    bottomLine: isLight ? "#e0e0e0" : "rgba(255, 255, 255, 0.1)",
  }

  // Set initial selected mode and rules
  useEffect(() => {
    if (game && game.set_of_rules.length > 0) {
      setSelectedMode(game.set_of_rules[0].game_mode)

      // Filter out null or empty rules before setting
      const ruleValues = Object.values(game.set_of_rules[0].rules || {})
      const validRules = ruleValues.filter(rule => rule && rule.trim() !== '')
      setRules(validRules)
    }
  }, [game])
  
  // Handle navigation back event - reopen the bottom sheet if needed
  useFocusEffect(
    useCallback(() => {
      // Setup back handler
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        if (returnToJoinSheet && gameData) {
          // We use setTimeout to ensure this happens after the navigation completes
          setTimeout(() => {
            checkAndReopenSheet({ returnToJoinSheet, gameData });
          }, 100);
        }
      });

      return unsubscribe;
    }, [navigation, returnToJoinSheet, gameData, checkAndReopenSheet])
  )

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setSelectedMode(mode.game_mode)

    // Filter out null or empty rules before setting
    const ruleValues = Object.values(mode.rules || {})
    const validRules = ruleValues.filter(rule => rule && rule.trim() !== '')
    setRules(validRules)
  }

  // If no game data, show error message
  if (!game) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Game data not found</Text>
        </View>
      </View>
    )
  }

  /**
   * Renders a game mode tab
   */
  const renderModeTab = ({ item }) => (
    <Pressable
      style={[
        styles.modeTab,
        {
          backgroundColor: selectedMode === item.game_mode ? colors.activeTab : colors.inactiveTab,
          borderColor: selectedMode === item.game_mode ? colors.ruleNumber : "transparent",
        },
      ]}
      onPress={() => handleModeSelect(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.modeTabText,
          {
            color: selectedMode === item.game_mode ? "#ffffff" : isLight ? "#000000" : "#ffffff",
            fontWeight: selectedMode === item.game_mode ? "600" : "400",
          },
        ]}
      >
        {item.game_mode}
      </Text>
    </Pressable>
  )

  /**
   * Renders a single rule item in card format
   * Only renders if the rule content exists and is not empty
   */
  const renderRule = ({ item, index }) => {
    // Skip rendering if rule is null, undefined, empty string, or just whitespace
    if (!item || item.trim() === '') {
      return null;
    }

    return (
      <View style={styles.ruleCardContainer}>
        <View
          style={[
            styles.ruleCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.ruleHeader}>
            <Text style={[styles.ruleNumber, { color: colors.ruleNumber }]}>Rule no.{index + 1}</Text>
          </View>
          <View style={{ width: '100%' }}>
            <Text style={[styles.ruleText, { color: colors.text }]}>{item}</Text>
          </View>

          <View style={[styles.bottomLine, { backgroundColor: colors.bottomLine }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Game Title Heading */}
        {/* <View style={styles.headingContainer}>
          <Text style={[styles.headingText, { color: colors.text }]}>{game.game_name} Game Rules</Text>
          <View style={[styles.headingUnderline, { backgroundColor: isLight ? "#000000" : "#ffffff" }]} />
        </View> */}


          <AppHeader
            backButton={true}
            title={`${game.game_name} Game Rules`}
            onBackPress={() => navigation.goBack()}
          />


        <View style={styles.modesContainer}>
          <FlatList
            data={game.set_of_rules}
            renderItem={renderModeTab}
            keyExtractor={(item) => item.game_mode}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeTabsContainer}
          />
        </View>

        <FlatList
          data={rules}
          renderItem={renderRule}
          keyExtractor={(item, index) => `rule-${index}`}
          scrollEnabled={false}
          contentContainerStyle={styles.rulesListContainer}
        />
      </ScrollView>
    </View>
  )
}

export default RulesList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    // paddingTop: 16,
  },
  headingContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headingText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  headingUnderline: {
    width: 80,
    height: 2,
    borderRadius: 1,
  },
  modesContainer: {
    marginBottom: 24,
  },
  modeTabsContainer: {
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 14,
  },
  rulesListContainer: {
    gap: 12,
  },
  ruleCardContainer: {
    marginHorizontal: 15,
  },
  ruleCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  ruleHeader: {
    marginBottom: 12,
  },
  ruleNumber: {
    fontSize: 14,
    fontWeight: "600",

  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 12,

  },
  bottomLine: {
    width: "100%",
    height: 1,
  },
})
