import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/customer/Home';
import OpenGames from '../screens/customer/OpenGames';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {  Octicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from '../store/themeStore';
import Notify from '../screens/customer/Notify';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function CustomerTabNavigator() {
    const insets = useSafeAreaInsets();
    const { isLight } = useThemeStore();

    return (

        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#00bf63',
                tabBarInactiveTintColor: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)',
                tabBarStyle: {
                      height: 56 + insets.bottom,
                    borderTopWidth: 0,
                    borderColor: isLight ? '#ffffff' : '#ffffff',
                    backgroundColor: isLight ? '#ffffff' : '#000000',
                },
                tabBarButton: (props) => (
                    <TouchableOpacity
                        {...props}
                        activeOpacity={1}
                        style={props.style}
                    />
                ),
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={Home}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: focused ? 'bold' : 'normal', marginBottom: 3 }}>Home</Text>
                    ),
                    tabBarIcon: ({ focused, color, size }) => (
                        <View style={styles.tabIconContainer}>
                            <MaterialCommunityIcons name="home-roof" size={size} color={color} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="OpenGamesTab"
                component={OpenGames}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: focused ? 'bold' : 'normal', marginBottom: 3 }}>Open Games</Text>
                    ),
                    tabBarIcon: ({ focused, color, size }) => (
                        <View style={styles.tabIconContainer}>
                            <MaterialCommunityIcons name="gamepad-variant-outline" size={size} color={color} />
                        </View>
                    ),
                }}
            />
 
            <Tab.Screen
                name="Notification"
                component={Notify}
                options={{
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={{ color, fontSize: 12, fontWeight: focused ? 'bold' : 'normal', marginBottom: 3 }}>Notify</Text>
                    ),
                    tabBarIcon: ({ focused, color, size }) => (
                        <View style={styles.tabIconContainer}>
                            <Octicons name="bell" size={20} color={color} />
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
        width: 25,
        height: 25,
    }
});
