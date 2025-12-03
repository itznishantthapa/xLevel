import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, useWindowDimensions, Text, Pressable, Animated } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useThemeStore } from '../../store/themeStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useGames } from '../../queries/useGames';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import MainTab from './gamesTabs/MainTab';


const OpenGames = () => {
  const layout = useWindowDimensions();
  const { isLight } = useThemeStore();
  const { data: games = [] } = useGames();
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);

  // Generate routes dynamically
  const routes = games.map(game => ({
    key: game?.game_id,
    title: game?.game_name,
    game_id: game?.game_id,
  }));

  // Custom TabBar
  const renderTabBar = props => {
    const { position } = props;

    return (
      <View style={styles.tabBarContainer}>
        <TabBar
          {...props}
          scrollEnabled
          activeColor={isLight ? '#000' : '#fff'}
          inactiveColor={isLight ? '#666' : '#aaa'}
          style={styles.tabBar}
          indicatorStyle={[styles.indicator, { backgroundColor: 'transparent' }]}
          tabStyle={styles.tab}
          renderTabBarItem={({ route, navigationState, onPress, onLongPress, activeColor, inactiveColor }) => {
            const inputRange = navigationState.routes.map((_, i) => i);
            const routeIndex = navigationState.routes.findIndex(r => r.key === route.key);
            const isActive = routeIndex === index;

            // Using regular Animated API which is compatible with react-native-tab-view
            const opacity = position.interpolate({
              inputRange,
              outputRange: inputRange.map(i => (i === routeIndex ? 1 : 0.6)),
              extrapolate: 'clamp',
            });

            const scale = position.interpolate({
              inputRange,
              outputRange: inputRange.map(i => (i === routeIndex ? 1.4 : 1)),
              extrapolate: 'clamp',
            });

            return (
              <Pressable
                onPress={onPress}
                onLongPress={onLongPress}
                style={{ height: 48, paddingHorizontal: 16, justifyContent: 'center' }}
              >
                <Animated.Text
                  style={{
                    fontWeight: '900',
                    opacity,
                    transform: [{ scale }],
                    color: isLight ? "#000000" : "#eaf4f4",
                    borderBottomWidth: isActive ? 1 : 0,
                    borderColor: isActive && isLight ? "#000000" : "#ffffff",
                  }}
                >
                  {route.title}
                </Animated.Text>
              </Pressable>
            );
          }}
          pressColor={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
        />
      </View>
    );
  };

  // Render scene for each tab
  const renderScene = ({ route }) => {

    return <MainTab gameId={route.game_id} gameName={route.title} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000', paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />

      {routes.length > 0 ? (
        <TabView
          lazy
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
          gestureHandlerProps={{ activeOffsetX: [-150, 150], failOffsetY: [-30, 30] }}
        />
      ) : (
        <View style={styles.notAvailableContainer}>
          <Text>No games available</Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(OpenGames);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBarContainer: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    backgroundColor: 'transparent',
    // paddingHorizontal:scaleWidth(10),
  },
  tabBar: {backgroundColor:'transparent', height: 48,elevation:0,shadowColor:'transparent',shadowOffset:{width:0,height:0},shadowOpacity:0,shadowRadius:0 },
  tab: { width: 'auto', minWidth: 90, marginHorizontal: 4 },
  tabLabel: { fontSize: 14, fontWeight: '600', textTransform: 'none', paddingHorizontal: 16 },
  indicator: { height: 3, marginBottom: 2 },
  tabView: { backgroundColor: 'transparent' },
  notAvailableContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noTabContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noTabText: { fontSize: 16, fontWeight: '500' },
});
