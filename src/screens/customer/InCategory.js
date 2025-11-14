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

  // Check if Utils has QR data
  const hasQR = !!utils?.qr




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
    // Check if Utils has QR data
    if (!hasQR) {
      navigation.navigate("watchAds")
      return
    }

    // If Utils has QR, navigate to scanPay
    navigation.navigate("scanPay")
  }




  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#eef0f2' : '#000000' }]}>
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
            num_loss={user?.num_loss || 0}
            num_win={user?.num_win || 0}
            handleWithdraw={() => navigation.navigate("withDraw")}
            handleTournament={() => navigation.navigate("userTournament")}
            handleGameRules={() => navigation.navigate("gameRules")}
            handleMatches={() => navigation.navigate("match")}
            handleWatchAds={() => navigation.navigate("watchAds")}
            handleLeaderboard={() => navigation.navigate("leaderboard")}
            handleTransaction={() => navigation.navigate("transaction")}
          />

          {/* Game Mode Selection */}
          <View style={[styles.gameModeContainer, { backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a' }]}>
            <GameMode
              game_mode={game.game_modes}
              handleGameMode={handleGameMode}
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