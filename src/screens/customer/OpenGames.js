import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View, useWindowDimensions, Text, Pressable, Animated } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useThemeStore } from '../../store/themeStore';
import { useGames } from '../../queries/useGames';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getOpenGamesTabIndex,
  setOpenGamesActiveGameId,
} from '../../utils/openGamesTabStorage';

import MainTab from './gamesTabs/MainTab';

const OpenGames = () => {
  const layout = useWindowDimensions();
  const { isLight } = useThemeStore();
  const { data: games = [] } = useGames();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [isTabReady, setIsTabReady] = useState(false);

  const routes = useMemo(
    () => games.map(game => ({
      key: String(game?.game_id),
      title: game?.game_name,
      game_id: game?.game_id,
    })),
    [games],
  );

  useEffect(() => {
    if (!routes.length) {
      setIsTabReady(false);
      return;
    }

    let isMounted = true;

    const restoreActiveTab = async () => {
      const savedIndex = await getOpenGamesTabIndex(routes);

      if (!isMounted) return;

      setIndex(savedIndex);
      setIsTabReady(true);
    };

    restoreActiveTab();

    return () => {
      isMounted = false;
    };
  }, [routes]);

  const handleIndexChange = useCallback((newIndex) => {
    setIndex(newIndex);

    const activeRoute = routes[newIndex];
    if (activeRoute?.game_id != null) {
      setOpenGamesActiveGameId(activeRoute.game_id);
    }
  }, [routes]);

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
          renderTabBarItem={({ route, navigationState, onPress, onLongPress }) => {
            const inputRange = navigationState.routes.map((_, i) => i);
            const routeIndex = navigationState.routes.findIndex(r => r.key === route.key);
            const isActive = routeIndex === index;

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
                    color: isLight ? '#000000' : '#eaf4f4',
                    borderBottomWidth: isActive ? 1 : 0,
                    borderColor: isActive && isLight ? '#000000' : '#ffffff',
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

  const renderScene = useCallback(({ route }) => {
    const routeIndex = routes.findIndex(item => item.key === route.key);

    return (
      <MainTab
        gameId={route.game_id}
        gameName={route.title}
        isActive={routeIndex === index}
      />
    );
  }, [routes, index]);

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000', paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />

      {routes.length > 0 && isTabReady ? (
        <TabView
          lazy
          lazyPreloadDistance={0}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
          gestureHandlerProps={{ activeOffsetX: [-150, 150], failOffsetY: [-30, 30] }}
        />
      ) : routes.length > 0 ? (
        <View style={styles.notAvailableContainer} />
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
  },
  tabBar: { backgroundColor: 'transparent', height: 48, elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
  tab: { width: 'auto', minWidth: 90, marginHorizontal: 4 },
  tabLabel: { fontSize: 14, fontWeight: '600', textTransform: 'none', paddingHorizontal: 16 },
  indicator: { height: 3, marginBottom: 2 },
  tabView: { backgroundColor: 'transparent' },
  notAvailableContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noTabContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noTabText: { fontSize: 16, fontWeight: '500' },
});
