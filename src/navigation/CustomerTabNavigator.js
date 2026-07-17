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

const TAB_BAR_CONTENT_HEIGHT = 68;

function renderTabIcon(routeName, focused, color) {
  const icon = TAB_ICONS[routeName];
  if (!icon) return null;

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <AppIcon
        icon={icon}
        size={iconSize.xl}
        color={color}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    </View>
  );
}

function renderTabLabel(label, focused, color) {
  return (
    <Text
      style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

export default function CustomerTabNavigator() {
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00bf63',
        tabBarInactiveTintColor: isLight ? '#000000' : 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: isLight ? '#E8E8E8' : '#1F1F1F',
          backgroundColor: isLight ? '#FFFFFF' : '#000000',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          height: TAB_BAR_CONTENT_HEIGHT,
          paddingVertical: 0,
        },
        tabBarButton: (props) => (
          <Pressable {...props} style={props.style} android_ripple={{ color: 'transparent' }} />
        ),
      }}
    >
      {TAB_CONFIG.map(({ name, component, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: ({ focused, color }) => renderTabLabel(label, focused, color),
            tabBarIcon: ({ focused, color }) => renderTabIcon(name, focused, color),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  iconWrapFocused: {
    transform: [{ scale: 1.04 }],
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: lineHeight.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
