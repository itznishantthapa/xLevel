import { StyleSheet, Text, View, FlatList, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons'
import { useThemeStore } from '../../../store/themeStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGameRules } from '../../../queries/useGameRules'
import Loader from '../../../component/Loader'
import AppHeader from '../header/AppHeader'

/**
 * GameRules Component
 * Displays a list of games with rules that users can access
 */
const GameRules = () => {
  const navigation = useNavigation()
  const { isLight } = useThemeStore()
  const insets = useSafeAreaInsets()
  const { data: gameRules, isLoading } = useGameRules()


  // React Query initially returns undefined while loading data
  // Only log when we have data or when loading is complete
  // Colors based on theme
  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    text: isLight ? '#333333' : '#ffffff',
    subText: isLight ? '#666666' : '#cccccc',
    card: isLight ? 'transparent' : '#000000',
    cardBorder: isLight ? '#333333' : '#ffffff',
    iconBg: isLight ? '#d9d9d9' : 'rgba(255, 255, 255, 0.2)',
  }

  /**
   * Renders an individual game card
   */
  const renderGameCard = ({ item }) => (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => navigation.navigate('rulesList', { game: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
          <SimpleLineIcons name="game-controller" size={32} color={isLight ? "#000000" : "#ffffff"} />
        </View>

        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, { color: colors.text }]}>{item.game_name}</Text>
          <Text style={[styles.gameModes, { color: colors.subText }]}>
            {item.set_of_rules.length} {item.set_of_rules.length === 1 ? 'mode' : 'modes'} available
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
      </View>
    </Pressable>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Game Rules</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
          Learn how to play different game modes
        </Text>
      </View> */}


        <AppHeader
          backButton={Platform.OS === 'ios' ? true : false}
          title={'Game Rules'}
        />
        <Text style={[styles.headerSubtitle, { color: colors.subText, marginLeft: 16 }]}>
          Check the simple rules before you play !
        </Text>



      {/* Loader */}
      <Loader visible={isLoading} message="Loading game rules..." />

      {/* Games List - Only show when not loading or when data is available */}
      {(!isLoading || gameRules) && (
        <FlatList
          data={gameRules || []}
          renderItem={renderGameCard}
          keyExtractor={(item) => item.game_name}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No game rules available
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  )
}

export default GameRules

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    fontSize: 14,
  },
})