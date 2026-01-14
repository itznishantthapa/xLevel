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
        return '#16A34A'; // Strong Green background for Game Points
      case 'tournament':
        return '#6366F1'; // Vibrant Indigo background for Tournament
      case 'matches':
        return '#EF4444'; // Bright Red background for My Match
      case 'redeem':
        return '#F97316'; // Bold Orange background for Redeem
      case 'leaderboard':
        return '#A855F7'; // Rich Purple background for Leaderboard
      case 'gamerules':
        return '#14B8A6'; // Fresh Teal background for Game Rules
      default:
        return 'transparent';
    }
  };

  // Function to get icon color based on item id
  const getIconColor = (itemId) => {
    // Show white icons on colored backgrounds in light mode when colorful icons are enabled
    if (!isLight || !colorfulIcons) return isLight ? '#000000' : '#EAEAEA';
    
    // All icons are white when colorful backgrounds are enabled
    return '#FFFFFF';
  };

  // Function to render icon based on item configuration
  const renderIcon = (item, defaultColor) => {
    const IconComponent = {
      Ionicons,
      MaterialIcons,
      SimpleLineIcons,
      MaterialCommunityIcons,
      AntDesign,
      FontAwesome5,
      FontAwesome6,
    }[item.iconLib];

    const backgroundColor = getIconBackgroundColor(item.id);
    const hasColorfulBackground = backgroundColor !== 'transparent';

    return (
      <View style={[
        styles.iconContainer,
        hasColorfulBackground && {
          backgroundColor: backgroundColor,
          borderRadius: scaleWidth(45) / 2, // Ensure circular shape
          // Add shadow only in light mode when colorful icons are enabled
          ...(isLight && colorfulIcons && Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 4.5,
          }),
          // Use elevation for Android
          ...(isLight && colorfulIcons && {
            elevation: 6,
          })
        }
      ]} key={`${item.id}-${colorfulIcons}`}>
        <IconComponent 
          name={item.icon} 
          size={scaleWidth(35)} 
          color={getIconColor(item.id)} 
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
    marginTop: scaleHeight(10),
    borderRadius: scaleWidth(25),
    paddingVertical:scaleHeight(12),
    borderWidth: 1.5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleWidth(45),
    height: scaleWidth(45),
    borderRadius: scaleWidth(45) / 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: scaleWidth(12),
    fontWeight: 'bold',
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'grey',
    marginVertical: 5,
    borderRadius: 1.5,
  },
})