import React from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native'
import { AntDesign, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons"
import { useThemeStore } from '../../store/themeStore';
import { useStatsPreferenceStore } from '../../store/statsPreference';


const StatsContainer = ({ handleTournament, handleGameRules, handleMatches, handleWatchAds, handleLeaderboard, handleWithdraw, handleTransaction }) => {
  const { isLight } = useThemeStore();
  const { statsConfig, isLoading } = useStatsPreferenceStore();
  // Function to render icon based on item configuration
  const renderIcon = (item, color, size = 30) => {
    const IconComponent = {
      Ionicons,
      MaterialIcons,
      SimpleLineIcons,
      MaterialCommunityIcons,
      AntDesign,
      FontAwesome5,
      FontAwesome6,
    }[item.iconLib];

    return <IconComponent name={item.icon} size={size} color={color} />;
  };

  // Function to handle item press based on item id
  const handleItemPress = (item) => {
    switch (item.id) {
      case 'watchads':
        handleWatchAds?.();
        break;
      case 'redeem':
        handleWithdraw?.();
        break;
      case 'leaderboard':
        handleLeaderboard?.();
        break;
      case 'gamerules':
        handleGameRules?.();
        break;
      case 'transaction':
        handleTransaction?.();
        break;
      case 'tournament':
        handleTournament?.();
        break;
      case 'matches':
        handleMatches?.();
        break;
      default:
        console.log('Unknown action:', item.id);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.statsContainer, isLight ? { borderColor: '#333333' } : { borderColor: '#EAEAEA' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, isLight ? { color: '#333333' } : { color: '#EAEAEA' }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.statsContainer, isLight ? { borderColor: '#333333' } : { borderColor: '#EAEAEA' }]}>
      {statsConfig.map((item, index) => (
        <React.Fragment key={item.id}>
          <Pressable style={styles.statItem} onPress={() => handleItemPress(item)}>
            {renderIcon(item, isLight ? '#333333' : '#EAEAEA')}
            <Text style={[styles.statLabel, isLight ? { color: '#333333' } : { color: '#EAEAEA' }]}>
              {item.name}
            </Text>
          </Pressable>
          {index < statsConfig.length - 1 && (
            <View style={styles.statDivider} />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

export default StatsContainer

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginTop: 10,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    paddingVertical: 15,
    borderWidth: 3,
    // marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 2,
    backgroundColor: 'grey',
    marginVertical: 5,
    borderRadius: 1.5,
  },
})