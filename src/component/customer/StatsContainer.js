import React from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native'
import { AntDesign, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons"
import { useThemeStore } from '../../store/themeStore';
import { useStatsPreferenceStore } from '../../store/statsPreference';
import { scaleHeight, scaleWidth } from '../../utils/scaling';


const StatsContainer = ({ handlePointsOut, handleTournament, handleGameRules, handleMatches, handleLeaderboard, handleGamePoints }) => {
  const { isLight } = useThemeStore();
  const { statsConfig, isLoading, colorfulIcons } = useStatsPreferenceStore();
  
  // Function to get subtle background color based on item id
  const getIconBackgroundColor = (itemId) => {
    // Only show backgrounds in light mode AND when colorful icons are enabled
    if (!isLight || !colorfulIcons) return 'transparent';
    
    switch (itemId) {
      case 'gamepoints':
        return 'rgba(0, 191, 99, 0.1)'; // Green for Game Points
      case 'tournament':
        return 'rgba(109, 140, 255, 0.1)'; // Blue for Tournament
      case 'matches':
        return 'rgba(255, 68, 68, 0.1)'; // Red for My Match
      case 'redeem':
        return 'rgba(255, 149, 0, 0.1)'; // Orange for Redeem
      case 'leaderboard':
        return 'rgba(0, 191, 99, 0.1)'; // Green for Leaderboard
      case 'gamerules':
        return 'rgba(109, 140, 255, 0.1)'; // Blue for Game Rules
      default:
        return 'transparent';
    }
  };

  // Function to get icon color based on item id
  const getIconColor = (itemId) => {
    // Only show custom colors in light mode AND when colorful icons are enabled
    if (!isLight || !colorfulIcons) return isLight ? '#000000' : '#EAEAEA';
    
    switch (itemId) {
      case 'gamepoints':
        return '#00bf63'; // Green for Game Points
      case 'tournament':
        return '#6d8cff'; // Blue for Tournament
      case 'matches':
        return '#FF4444'; // Red for My Match
      case 'redeem':
        return '#FF9500'; // Orange for Redeem
      case 'leaderboard':
        return '#00bf63'; // Green for Leaderboard
      case 'gamerules':
        return '#6d8cff'; // Blue for Game Rules
      default:
        return '#000000';
    }
  };

  // Function to render icon based on item configuration
  const renderIcon = (item, defaultColor, size = 30) => {
    const IconComponent = {
      Ionicons,
      MaterialIcons,
      SimpleLineIcons,
      MaterialCommunityIcons,
      AntDesign,
      FontAwesome5,
      FontAwesome6,
    }[item.iconLib];

    return (
      <View style={styles.iconContainer}>
        {/* Absolute positioned background */}
        <View style={[
          styles.iconBackground,
          { backgroundColor: getIconBackgroundColor(item.id) }
        ]} />
        <IconComponent 
          name={item.icon} 
          size={size} 
          color={getIconColor(item.id)} 
          style={styles.iconStyle} 
        />
      </View>
    );
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
        // Redeem should navigate to Points Out
        handlePointsOut?.();
        break;
      case 'gamepoints':
        handleGamePoints?.();
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
    paddingVertical:scaleHeight(12),
    borderWidth: 1.5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleWidth(45),
    height: scaleWidth(45),
  },
  iconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleWidth(45),
    height: scaleWidth(45),
    borderRadius: scaleWidth(22.5),
  },
  iconStyle: {
    zIndex: 1,
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