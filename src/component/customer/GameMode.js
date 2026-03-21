"use client"
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, Platform } from "react-native"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useThemeStore } from "../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import { useUtils } from "../../queries/useUtils"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 40

// Monochrome accent colors

const GameMode = ({ game_mode, handleGameMode, game }) => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
    const {data: utils = []} = useUtils()
    const isIOSActive = !!utils?.is_ios_active

    const isStoreActive = (() => {
      if (!game?.game_name) return false
      const store = utils?.active_store
      if (!store) return false
      const name = game.game_name.toLowerCase()
      if (name.includes('free fire') || name.includes('freefire')) return !!store.is_freefire_store_active
      if (name.includes('pubg')) return !!store.is_pubg_store_active
      if (name.includes('efootball')) return !!store.is_efootball_store_active
      if (name.includes('mlbb')) return !!store.is_mlbb_store_active
      return false
    })()

    const showStore = isIOSActive && isStoreActive
    

  const getGameModeIcon = () => {
    return "gamepad"
  }





  const renderGameCard = ({ item, index }) => {
    const iconName = getGameModeIcon(item)
    const cardColor = isLight ? '#1a1a1a' : '#ffffff'
    const accentAlt = isLight ? '#555555' : '#aaaaaa'

    return (
      <Pressable
        style={[
          styles.gameCard,
          isLight ? styles.gameCardLight : styles.gameCardDark
        ]}
        onPress={() => handleGameMode(item)}
      >
        {/* Geometric Corner Accents */}
        <View pointerEvents="none" style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: cardColor }]} />
        <View pointerEvents="none" style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: accentAlt }]} />
        
        {/* Left Side - Index Number */}
        <View style={styles.indexContainer}>
          <Text style={[styles.indexNumber, { color: cardColor }]}>
            {String(index + 1).padStart(2, '0')}
          </Text>
          <View style={[styles.indexLine, { backgroundColor: cardColor }]} />
        </View>

        {/* Center Content */}
        <View style={styles.cardContent}>
          <View style={[styles.iconWrapper, isLight ? styles.iconWrapperLight : styles.iconWrapperDark, { borderColor: cardColor }]}>
            <MaterialIcons 
              name={iconName} 
              size={24} 
              color={cardColor} 
            />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.modeLabel, { color: cardColor }]}>MODE</Text>
            <Text style={[styles.modeName, isLight ? styles.nameLight : styles.nameDark]}>{item}</Text>
          </View>
        </View>

        {/* Right Arrow */}
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowLine, { backgroundColor: cardColor }]} />
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={cardColor} 
          />
        </View>
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, isLight ? styles.containerLight : styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={[styles.titleAccent, isLight ? styles.accentLight : styles.accentDark]} />
            <Text style={[styles.title, isLight ? styles.titleLight : styles.titleDark]}>
              SELECT MODE
            </Text>
          </View>
          <Text style={[styles.subtitle, isLight ? styles.subtitleLight : styles.subtitleDark]}>
            Choose your Match & Create
          </Text>
        </View>
      </View>

      {/* Geometric Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, isLight ? styles.dividerLight : styles.dividerDark]} />
        <View style={[styles.dividerDiamond, isLight ? styles.diamondLight : styles.diamondDark]} />
        <View style={[styles.dividerLine, isLight ? styles.dividerLight : styles.dividerDark]} />
      </View>

      {/* Game Modes List */}
      <FlatList
        data={game_mode}
        renderItem={renderGameCard}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={showStore ? () => (
          <View style={styles.storeSection}>
            {/* Store Section Header */}
            <View style={styles.storeSectionHeader}>
              <View style={styles.titleRow}>
                <View style={[styles.titleAccent, { backgroundColor: isLight ? '#1a1a1a' : '#ffffff' }]} />
                <Text style={[styles.sectionTitle, isLight ? styles.titleLight : styles.titleDark]}>
                  GAME STORE
                </Text>
              </View>
              <Text style={[styles.subtitle, isLight ? styles.subtitleLight : styles.subtitleDark]}>
                Get Game Items
              </Text>
            </View>

            {/* Store Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, isLight ? styles.dividerLight : styles.dividerDark]} />
              <View style={[styles.dividerDiamond, { backgroundColor: isLight ? '#555555' : '#aaaaaa' }]} />
              <View style={[styles.dividerLine, isLight ? styles.dividerLight : styles.dividerDark]} />
            </View>


          </View>
        ) : null}
      />

      {/* Back Button - Bottom Left */}
      <Pressable 
        onPress={() => navigation.goBack()} 
        style={[styles.backButton, isLight ? styles.backButtonLight : styles.backButtonDark]}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={isLight ? "#1a1a1a" : "#ffffff"} 
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#0a0a0a",
  },
  backButton: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonLight: {
    backgroundColor: "#ffffff",
  },
  backButtonDark: {
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  titleContainer: {
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  accentLight: {
    backgroundColor: "#1a1a1a",
  },
  accentDark: {
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  titleLight: {
    color: "#1a1a1a",
  },
  titleDark: {
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 4,
    marginLeft: 14,
  },
  subtitleLight: {
    color: "#666666",
  },
  subtitleDark: {
    color: "#888888",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLight: {
    backgroundColor: "#d0d0d0",
  },
  dividerDark: {
    backgroundColor: "#333333",
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 12,
  },
  diamondLight: {
    backgroundColor: "#1a1a1a",
  },
  diamondDark: {
    backgroundColor: "#ffffff",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  separator: {
    height: 12,
  },
  storeSection: {
    marginTop: 24,
  },
  storeSectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  gameCard: {
    width: CARD_WIDTH,
    height: 80,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  gameCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e0e0e0",
  },
  gameCardDark: {
    backgroundColor: "#141414",
    borderColor: "#2a2a2a",
  },
  cornerAccent: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 2.5,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  indexContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  indexNumber: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 2,
  },
  indexLight: {
    color: "#cccccc",
  },
  indexDark: {
    color: "#444444",
  },
  indexLine: {
    width: 1,
    height: 12,
    marginTop: 4,
  },
  lineLight: {
    backgroundColor: "#d0d0d0",
  },
  lineDark: {
    backgroundColor: "#333333",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iconWrapperLight: {
    backgroundColor: "#f8f8f8",
    borderColor: "#e8e8e8",
  },
  iconWrapperDark: {
    backgroundColor: "#1f1f1f",
    borderColor: "#333333",
  },
  textContent: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 2,
  },
  labelLight: {
    color: "#999999",
  },
  labelDark: {
    color: "#666666",
  },
  modeName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nameLight: {
    color: "#1a1a1a",
  },
  nameDark: {
    color: "#ffffff",
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowLine: {
    width: 20,
    height: 1,
  },
})

export default GameMode
