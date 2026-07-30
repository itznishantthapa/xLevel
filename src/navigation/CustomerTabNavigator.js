import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/common/AppIcon';
import {
  Home01Icon,
  GameController03Icon,
  StoreIcon,
  ShoppingBasket01Icon,
  Notification01Icon,
} from '@hugeicons/core-free-icons';

import Home from '../screens/customer/Home';
import OpenGames from '../screens/customer/OpenGames';
import GameStores from '../screens/customer/store/GameStores';
import BuySell from '../screens/customer/store/Store';
import Notify from '../screens/customer/Notify';
import { useThemeStore } from '../store/themeStore';
import { fontSize, spacing, iconSize, lineHeight } from '../theme/typography';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#00bf63';
const TAB_BAR_CONTENT_HEIGHT = 64;

const TAB_ICONS = {
  HomeTab: Home01Icon,
  OpenGamesTab: GameController03Icon,
  StoreTab: StoreIcon,
  BuySellTab: ShoppingBasket01Icon,
  Notification: Notification01Icon,
};

const TAB_CONFIG = [
  { name: 'HomeTab', component: Home, label: 'Home' },
  { name: 'OpenGamesTab', component: OpenGames, label: 'Matches' },
  { name: 'StoreTab', component: GameStores, label: 'Store' },
  { name: 'BuySellTab', component: BuySell, label: 'Buy&Sell' },
  { name: 'Notification', component: Notify, label: 'Notifee' },
];

const TAB_LABELS = Object.fromEntries(TAB_CONFIG.map(({ name, label }) => [name, label]));

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore();

  const inactiveColor = isLight ? '#000000' : 'rgba(255, 255, 255, 0.6)';
  const barBackground = isLight ? '#FFFFFF' : '#000000';
  const borderColor = isLight ? '#000000' : '#FFFFFF';

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: barBackground,
          borderTopColor: borderColor,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      <View style={styles.tabBarRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : inactiveColor;
          const label = TAB_LABELS[route.name] ?? route.name;
          const icon = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              android_ripple={{ color: 'transparent' }}
            >
              <View style={styles.tabItemInner}>
                {icon ? (
                  <AppIcon
                    icon={icon}
                    size={iconSize.xl}
                    color={color}
                    strokeWidth={isFocused ? 2.2 : 1.8}
                  />
                ) : null}
                <Text
                  style={[
                    styles.tabLabel,
                    { color },
                    isFocused && styles.tabLabelFocused,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.9}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {TAB_CONFIG.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1.5,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_CONTENT_HEIGHT,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 80,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    gap: spacing.xs,
  },
  tabLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    lineHeight: lineHeight.base,
    textAlign: 'center',
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
