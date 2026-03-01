import { View, Text, StyleSheet, ScrollView, StatusBar, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useThemeStore } from '../../../store/themeStore'
import AppHeader from '../header/AppHeader'
import { MaterialIcons } from '@expo/vector-icons'

const MLBBStore = ({ route }) => {
  const { game } = route.params || {}
  const navigation = useNavigation()
  const { isLight } = useThemeStore()

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000' }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <AppHeader backButton={true} title="MLBB Store" />
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Game Info Header */}
          <View style={[styles.gameHeader, { backgroundColor: isLight ? "rgba(0, 0, 0, 0.05)" : "#1a1a1a" }]}>
            <Image source={{ uri: game?.game_logo_url }} style={styles.gameLogo} />
            <View style={styles.gameInfo}>
              <Text style={[styles.gameName, { color: isLight ? '#333333' : '#ffffff' }]}>
                {game?.game_name || 'MLBB'}
              </Text>
              <View style={styles.securityBadge}>
                <MaterialIcons name="verified-user" size={14} color={'#00bf63'} />
                <Text style={[styles.securityText, { color: isLight ? '#333333' : '#ffffff' }]}>
                  100% Secure
                </Text>
                <Text style={[styles.separator, { color: isLight ? '#666666' : '#999999' }]}>|</Text>
                <Text style={[styles.securityText, { color: isLight ? '#333333' : '#ffffff' }]}>
                  Fast
                </Text>
                <Text style={[styles.separator, { color: isLight ? '#666666' : '#999999' }]}>|</Text>
                <Text style={[styles.securityText, { color: isLight ? '#333333' : '#ffffff' }]}>
                  Cheapest
                </Text>
              </View>
            </View>
          </View>

          {/* Store Content - To be implemented */}
          <View style={styles.storeContent}>
            {/* Future store items will go here */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  gameLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  storeContent: {
    flex: 1,
    paddingTop: 10,
  },
})

export default MLBBStore
