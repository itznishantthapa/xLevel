import { StatusBar, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { handleInstagram, handleMessenger, handleWhatsapp } from '../../service/homeHandler';
import Header from '../../component/customer/Header';
import StatsContainer from '../../component/customer/StatsContainer';
import GameMode from '../../component/customer/GameMode';
import { useSocials } from '../../queries/useSocials';
import { useUtils } from '../../queries/useUtils';
import { useEffect } from 'react';




/**
 * InCategory Screen Component
 * Displays game modes and allows user to select game type
 */
const InCategory = ({ route }) => {
  const { game } = route.params;   
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { isLight } = useThemeStore();
    const { data: socials = [] } = useSocials()
    const {data: utils = []} = useUtils()

  // Check if iOS is active
  const isIOSActive = !!utils?.is_ios_active


  




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




  



  const handleMessengerWrapper = () => {
    const messengerData = socials.find((social) => social.name === "Messenger")
    handleMessenger(messengerData?.url, messengerData?.web_url)
  }

  const handleInstagramWrapper = () => {
    const instagramData = socials.find((social) => social.name === "Instagram")
    handleInstagram(instagramData?.url, instagramData?.web_url)
  }

  const handleWhatsappWrapper = () => {
    const whatsappData = socials.find((social) => social.name === "Whatsapp")
    handleWhatsapp(whatsappData?.url, whatsappData?.web_url)
  }

  const handleHeaderGamePoint = () => {
    // Get active load way settings
    const isDynamicActive = utils?.active_load_way?.is_dynamic_active
    const isStaticActive = utils?.active_load_way?.is_static_active

    // Conditional navigation based on active load way
    if (isDynamicActive) {
      navigation.navigate("dynamicIn")
    } else if (isStaticActive) {
      navigation.navigate("pointsIn")
    } else {
      // Default to static (PointsIn) if none are active
      navigation.navigate("pointsIn")
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
            handleMessenger={handleMessengerWrapper}
            handleInstagram={handleInstagramWrapper}
            handleWhatsapp={handleWhatsappWrapper}
            handleHeaderGamePoint={handleHeaderGamePoint}
          />


          {/* Stats Section */}
          <StatsContainer
            handleRequests={() => navigation.navigate('gamePoints')}
            handleRedeem={() => navigation.navigate('pointsOut')}
            handleTournament={() => navigation.navigate('userTournament')}
            handleMatches={() => navigation.navigate('match')}
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