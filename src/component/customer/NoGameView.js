import { View, Text, StyleSheet } from "react-native"
import { Infinity01Icon } from "@hugeicons/core-free-icons"
import AppIcon from "../../components/common/AppIcon"
import { useThemeStore } from "../../store/themeStore"

const NoGamesView = () => {
  const { isLight } = useThemeStore()
  return (
    <View style={styles.container}>

      <AppIcon icon={Infinity01Icon} size={120} color={isLight ? "#000000" : "#ffffff"} strokeWidth={1.5} />
      <Text style={[styles.title, { color: isLight ? "#000000" : "#FFFFFF" }]}>Looks like the arena is quiet for you today !</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,

  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(156, 163, 175, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: null,
  },
})

export default NoGamesView
