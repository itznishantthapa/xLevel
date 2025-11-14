import { Linking, ScrollView, Text, View, StyleSheet, StatusBar, Platform } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AppHeader from "../header/AppHeader"

export default function Credits() {
    const { isLight } = useThemeStore()
    const insets = useSafeAreaInsets()

    const colors = {
        background: isLight ? "#eef0f2" : "#000000",
        text: isLight ? "#000000" : "#ffffff",
        link: "#1E90FF",
        textSecondary: isLight ? "#666666" : "#999999",
    }

    const openLink = (url) => Linking.openURL(url)

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
               <AppHeader
              backButton={true}
              title={'Credits & Attributions'}
            />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        

    


                {/* Summary Table */}
                <View style={styles.item}>
                    <Text style={[styles.subtitle, { color: colors.text }]}>Graphics Overview</Text>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        This app uses graphics from Icons8. All graphics are credited, and usage complies with their license.
                    </Text>

                    <Text style={[styles.text, { color: colors.textSecondary, marginTop: 6 }]}>
                        • Icons8 Icons – Free account license – Source: Icons8 – https://icons8.com – Universal Multimedia License
                    </Text>
                </View>

                {/* Icons8 */}
                <View style={styles.item}>
                    <Text style={[styles.label, { color: colors.text }]}>Icons8 Graphics</Text>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        We use three specific icons from Icons8 under Universal Multimedia License. Free account usage requires visible credit. Ownership remains with Icons8.
                    </Text>

                    <Text style={[styles.text, { color: colors.textSecondary, fontWeight: '600', marginTop: 8 }]}>
                        Icons used:
                    </Text>
                    <Text
                        style={[styles.link, { color: colors.link }]}
                        onPress={() => openLink("https://icons8.com/icon/Wp2G7sYdft8K/free-fire")}
                    >
                        • Free Fire icon
                    </Text>
                    <Text
                        style={[styles.link, { color: colors.link }]}
                        onPress={() => openLink("https://icons8.com/icon/C5LTcmsc3cr0/chess-com")}
                    >
                        • Chess icon
                    </Text>
                    <Text
                        style={[styles.link, { color: colors.link }]}
                        onPress={() => openLink("https://icons8.com/icon/Q-w-oliUeaEN/pubg-helmet")}
                    >
                        • PUBG Helmet icon
                    </Text>

                    <Text
                        style={[styles.link, { color: colors.link, marginTop: 6 }]}
                        onPress={() => openLink("https://icons8.com")}
                    >
                        Provided by Icons8 – https://icons8.com
                    </Text>
                    <Text style={[styles.text, { color: colors.textSecondary, marginTop: 4 }]}
                      onPress={() => openLink("https://icons8.com/license")}
                      >
                        License details: https://icons8.com/license
                        
                    </Text>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
    subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
    item: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
    text: { fontSize: 14, marginBottom: 6, lineHeight: 20 },
    link: { fontSize: 14, textDecorationLine: "underline" },
})
