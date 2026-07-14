import { StatusBar, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Header from '../../component/customer/Header';
import StatsContainer from '../../component/customer/StatsContainer';
import GameMode from '../../component/customer/GameMode';
import { useUtils } from '../../queries/useUtils';




/**
 * InCategory Screen Component
 * Displays game modes and allows user to select game type
 */
const InCategory = ({ route }) => {
  const { game } = route.params;   
  const navigation = useNavigation();
  const { user, get_user } = useAuthStore();
  const { isLight } = useThemeStore();
    const {data: utils = []} = useUtils()

  useFocusEffect(
    useCallback(() => {
      get_user();
    }, [get_user]),
  );



  /**
   * Handles game mode selection and navigation
   */
  const handleGameMode = (selectedGameMode) => {
    // Check if the game is eFootball and route to appropriate creation screen
    if (game.game_name.toLowerCase().includes('efootball')) {
      navigation.navigate('efootballCreate', {
        game_id: game.game_id,
        game_name: game.game_name,
        game_mode: selectedGameMode
      });
    } 
   else if (game.game_name.toLowerCase().includes('chess')) {
      navigation.navigate('createChess', {
        game_id: game.game_id,
        game_name: game.game_name,
        game_mode: selectedGameMode
      });
    } 
    
   else if (game.game_name.toLowerCase().includes('pubg')) {
      navigation.navigate('createPubg', {
        game_id: game.game_id,
        game_name: game.game_name,
        game_mode: selectedGameMode
      });
    } 
    
    else if (game.game_name.toLowerCase().includes('mlbb') && 
      (selectedGameMode.toLowerCase() === 'classic' || selectedGameMode.toLowerCase() === 'brawl')) {
      navigation.navigate('createMLBB', {
        game_id: game.game_id,
        game_name: game.game_name,
        game_mode: selectedGameMode
      });
    } 
    
    else {
      // Default to regular createGame for other games (like Free Fire)
      navigation.navigate('createGame', {
        game_id: game.game_id,
        game_name: game.game_name,
        game_mode: selectedGameMode
      });
    }
  };




  /**
   * Navigation handlers
   */
  const handleProfile = () => {
    navigation.navigate('profile', { userData: user });
  }




  



  const handleHeaderGamePoint = () => {
    // Get active load way settings
    const isDynamicActive = utils?.active_load_way?.is_dynamic_active
    const isStaticActive = utils?.active_load_way?.is_static_active

    // Conditional navigation based on active load way
    if (isDynamicActive) {
      navigation.navigate("dynamicIn")
    } else if (isStaticActive) {
      navigation.navigate("copyRemark")
    } else {
      navigation.navigate("copyRemark")
    }
  }




  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000' }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <Header
            player_name={user?.full_name}
            wallet_balance={user?.wallet_balance}
            profile_picture={user?.profile_picture}
            handleProfile={handleProfile}
            handleHeaderGamePoint={handleHeaderGamePoint}
          />


          {/* Stats Section */}
          <StatsContainer
            handleRequests={() => navigation.navigate('gamePoints')}
            handleRedeem={() => navigation.navigate('pointsOut')}
            handleTournament={() => navigation.navigate('userTournament')}
            handleMatches={() => navigation.navigate('match')}
            isTournamentActive={!!user?.is_tournament_active}
            isMatchActive={!!user?.is_match_active}
            isRequestActive={!!user?.is_request_active}
          />

          {/* Game Mode Selection */}
          <View style={[styles.gameModeContainer, { backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a' }]}>
            <GameMode
              game_mode={game.game_modes}
              handleGameMode={handleGameMode}
              game={game}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}




export default InCategory




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
  gameModeContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    marginTop: 10,
  },
});