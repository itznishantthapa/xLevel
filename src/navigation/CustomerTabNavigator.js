import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/customer/Home';
import OpenGames from '../screens/customer/OpenGames';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather, Entypo, Octicons, Foundation } from "@expo/vector-icons";
import { useThemeStore } from '../store/themeStore';
import Notify from '../screens/customer/Notify';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Store from '../screens/customer/store/Store';

const Tab = createBottomTabNavigator();

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
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    borderTopWidth: 0,
                    backgroundColor: isLight ? '#ffffff' : '#000000',
                },
                tabBarButton: (props) => (
                    <TouchableOpacity
                        {...props}
                        activeOpacity={0.7}
                        style={props.style}
                    />
                ),
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={Home}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{
                            color,
                            fontSize: 11,
                            fontWeight: focused ? '600' : '500',
                            marginTop: 4
                        }}>
                            Home
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={[
                            styles.tabIconContainer,
                            focused && styles.focusedIconContainer
                        ]}>
                            {
                                focused ? (
                                    <Foundation name="home" size={22} color={color} />
                                ) : (
                                    <Feather name="home" size={22} color={color} />
                                )
                            }



                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="OpenGamesTab"
                component={OpenGames}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{
                            color,
                            fontSize: 11,
                            fontWeight: focused ? '600' : '500',
                            marginTop: 4,
                        }}>
                            Open Games
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={[
                            styles.tabIconContainer,
                            focused && styles.focusedIconContainer
                        ]}>
                            <MaterialCommunityIcons
                                name={focused ? "gamepad-variant" : "gamepad-variant-outline"}
                                size={28}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="StoreTab"
                component={Store}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{
                            color,
                            fontSize: 11,
                            fontWeight: focused ? '600' : '500',
                            marginTop: 4,
                        }}>
                           My Store
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={[
                            styles.tabIconContainer,
                            focused && styles.focusedIconContainer
                        ]}>
                            <MaterialCommunityIcons
                                name={focused ? "store-plus" : "store-plus-outline"}
                                size={28}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="Notification"
                component={Notify}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{
                            color,
                            fontSize: 11,
                            fontWeight: focused ? '600' : '500',
                            marginTop: 4
                        }}>
                            Notifications
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={[
                            styles.tabIconContainer,
                            focused && styles.focusedIconContainer
                        ]}>
                            <Octicons
                                name={focused ? "bell-fill" : "bell"}
                                size={21} color={color} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
    },
    focusedIconContainer: {
        transform: [{ scale: 1.1 }],
    },
});
