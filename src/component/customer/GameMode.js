"use client"
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions, FlatList, Platform } from "react-native"
import { Entypo, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useThemeStore } from "../../store/themeStore"
import { useNavigation } from "@react-navigation/native"
import AppHeader from "../../screens/customer/header/AppHeader"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.95
const CARD_HEIGHT = 160

const GameMode = ({ game_mode, handleGameMode }) => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const getGameModeIcon = (mode) => {
    switch (mode) {
      case "Clash Squad":
        return "groups"
      case "Lone Wolf":
        return "person"
      default:
        return "gamepad"
    }
  }



  const renderGameCard = ({ item }) => {

    const iconName = getGameModeIcon(item)

    return (
      <Pressable
        style={[styles.gameCard, { transform: [{ scale: 1 }] }]}
        onPress={() => handleGameMode(item)}
        activeOpacity={0.95}
      >
        {/* <ImageBackground source={{ uri: item.bg_url }} style={styles.gameImage} imageStyle={styles.imageStyle}> */}
        {/* Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >


          {/* Middle Section - Game Icon */}
          <View style={styles.middleSection}>
            <View style={styles.gameIconContainer}>
              <MaterialIcons name={iconName} size={32} color="#ffffff" />
            </View>
          </View>

          {/* Bottom Section - Game Mode Name */}
          <View style={styles.bottomSection}>
            <View style={styles.modeNameContainer}>
              <Text style={styles.modeNameText}>{item}</Text>
              <View style={styles.modeNameUnderline} />
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeElements}>
              <View style={styles.decorativeDot} />
              <View style={styles.decorativeLine} />
              <View style={styles.decorativeDot} />
            </View>
          </View>

          {/* Shine Effect */}
          <View style={styles.shineEffect} />
        </LinearGradient>
        {/* </ImageBackground> */}
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={[styles.header, { paddingHorizontal: 20 }]} onPress={() => { navigation.goBack() }} disabled={Platform.OS === 'android'}>
        {
          Platform.OS === 'ios' && (
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
              <MaterialCommunityIcons name="backburger" size={24} color={"#00ff88"} />
            </Pressable>
          )
        }
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isLight ? '#333333' : '#EAEAEA' }]}>Game Modes</Text>
          <View style={styles.titleUnderline} />
        </View>
      </Pressable>


      {/* Game Grid */}
      <FlatList
        data={game_mode}
        renderItem={renderGameCard}
        keyExtractor={(item, index) => index.toString()}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // marginVertical: 20,
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#00ff88",
    borderRadius: 2,
    marginTop: 4,
  },
  gridContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  gameCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "center",
  },
  gameImage: {
    width: "100%",
    height: "100%",
  },
  imageStyle: {
    borderRadius: 24,
  },
  gradientOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },

  middleSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gameIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
    padding: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  bottomSection: {
    alignItems: "center",
    gap: 8,
  },
  modeNameContainer: {
    alignItems: "center",
  },
  modeNameText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modeNameUnderline: {
    width: 40,
    height: 2,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    marginTop: 4,
    opacity: 0.8,
  },
  decorativeElements: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  decorativeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  decorativeLine: {
    width: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  shineEffect: {
    position: "absolute",
    top: 0,
    left: -100,
    width: 50,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "-20deg" }],
  },
})

export default GameMode
