import React from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native'
import { AntDesign, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons"
import { useThemeStore } from '../../store/themeStore';
import { useStatsPreferenceStore } from '../../store/statsPreference';
import { scaleWidth } from '../../utils/scaling';


const StatsContainer = ({ handleWithdraw, handleTournament, handleGameRules, handleMatches, handleLeaderboard, handleTransaction }) => {
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
      case 'leaderboard':
        handleLeaderboard?.();
        break;
      case 'gamerules':
        handleGameRules?.();
        break;
      case 'redeem':
        // Redeem should navigate to Withdraw
        handleWithdraw?.();
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
    <View style={[styles.statsContainer, isLight ? { borderColor: '#1A1A1A' } : { borderColor: '#EAEAEA' }]}>
      {statsConfig.map((item, index) => (
        <React.Fragment key={item.id}>
          <Pressable style={styles.statItem} onPress={() => handleItemPress(item)}>
            {renderIcon(item, isLight ? '#000000' : '#EAEAEA')}
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
    marginHorizontal: scaleWidth(16),
    marginTop: 10,
    borderRadius: scaleWidth(15),
    paddingVertical: 15,
    borderWidth: 1.5,
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
    width: 1,
    backgroundColor: 'grey',
    marginVertical: 5,
    borderRadius: 1.5,
  },
})