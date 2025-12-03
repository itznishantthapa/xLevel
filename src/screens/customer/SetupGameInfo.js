import { StatusBar, StyleSheet, Text, View, Pressable, Image, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { useGameProfiles } from '../../queries/useGameProfiles'
import { useGames } from '../../queries/useGames'
import AppHeader from './header/AppHeader'

const SetupGameInfo = () => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const { data: gameProfiles = [] } = useGameProfiles();
  const { data: games = [] } = useGames();

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000' }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <AppHeader
        
          title="Game Profiles"
          backButton={true}
          
        />
 

        {/* Games Grid */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gamesGrid}>
            {games?.map((game) => {
              const isAdded = gameProfiles?.some(profile => profile.game_id === game.game_id);
              
              return (
                <Pressable
                  key={game.game_id}
                  style={[
                    styles.gameCard,
                    { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' },
                    isAdded && styles.addedGameCard
                  ]}
                  onPress={() => {
                    if (!isAdded) {
                      navigation.navigate('editGameInfo', { game });
                    }
                  }}
                  disabled={isAdded}
                >
                  <Image
                    source={{ uri: game.game_logo_url }}
                    style={styles.gameImage}
                  />
                  <View style={styles.gameInfo}>
                    <Text style={[
                      styles.gameName,
                      { color: isLight ? "#000" : "#fff" },
                      isAdded && styles.addedGameText
                    ]}>
                      {game.game_name}
                    </Text>
                    <Text style={[
                      styles.gameModes,
                      { color: isLight ? "#666" : "#999" },
                      isAdded && styles.addedGameText
                    ]}>
                      {game.game_modes.join(' • ')}
                    </Text>
                    {isAdded && (
                      <View style={[styles.addedBadge, { backgroundColor: isLight ? '#000000' : '#ffffff' }]}>
                        <Text style={[styles.addedBadgeText, { color: isLight ? '#ffffff' : '#000000' }]}>Added</Text>
                        <Ionicons 
                          name="checkmark" 
                          size={12} 
                          color={isLight ? '#ffffff' : '#000000'} 
                          style={{ marginLeft: 2 }}
                        />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default SetupGameInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gamesGrid: {
    paddingVertical: 16,
    gap: 12,
  },
  gameCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  addedGameCard: {
    opacity: 0.6,
  },
  gameImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameModes: {
    fontSize: 12,
  },
  addedGameText: {
    opacity: 0.6,
  },
  addedBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
