
import { StyleSheet, Text, View, FlatList, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons'
import { useThemeStore } from '../../../store/themeStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGameRules } from '../../../queries/useGameRules'
import { useAuthStore } from '../../../store/authStore'
import AppHeader from '../header/AppHeader'

/**
 * GameRules Component
 * Displays a list of games with rules that users can access
 */
const SelectIssue = ({ route }) => {
    const { challenge_id, isCreator, game_name, game_mode, opponent } = route.params;

    const navigation = useNavigation()
    const { isLight } = useThemeStore()
    const { user } = useAuthStore()
    const insets = useSafeAreaInsets()
    const { data: gameRules, isLoading } = useGameRules()


    // React Query initially returns undefined while loading data
    // Only log when we have data or when loading is complete
    // Colors based on theme
    const colors = {
        background: isLight ? '#ffffff' : '#000000',
        text: isLight ? '#333333' : '#ffffff',
        subText: isLight ? '#666666' : '#cccccc',
        card: isLight ? '#ffffff' : '#000000',
        cardBorder: isLight ? '#333333' : '#ffffff',
        iconBg: isLight ? '#d9d9d9' : 'rgba(255, 255, 255, 0.2)',
    }



 


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />



            <AppHeader
                backButton={Platform.OS === 'ios' ? true : false}
                title={'Report Issue'}
            />


            <View style={{ marginTop: 10, paddingHorizontal: 10 }}>

                <Pressable
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'mistake_setting', game_name, game_mode })}  // Pass game_name and game_mode
                >
                    <View style={styles.cardContent}>

                        <View style={styles.gameInfo}>
                            <Text style={[styles.gameName, { color: colors.text }]}>Game Settings</Text>
                            <Text style={[styles.gameModes, { color: colors.subText }]}>
                                Report if the game settings metioned by the creator are not matching with the actual game settings.
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                    </View>
                </Pressable>


                {
                    isCreator && (
                        <Pressable
                            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'opponent_not_joined', game_name, game_mode })}  // Pass game_name and game_mode
                        >
                            <View style={styles.cardContent}>

                                <View style={styles.gameInfo}>
                                    <Text style={[styles.gameName, { color: colors.text }]}>Didn't Join?</Text>
                                    <Text style={[styles.gameModes, { color: colors.subText }]}>
                                        Report issue if confimed opponent didn't join the room/match even after providing game credentials 2 times.
                                    </Text>
                                </View>

                                <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                            </View>
                        </Pressable>
                    )
                }


                {
                    !isCreator && (
                        <Pressable
                            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'creator_not_provided', game_name, game_mode })}  // Pass game_name and game_mode
                        >
                            <View style={styles.cardContent}>

                                <View style={styles.gameInfo}>
                                    <Text style={[styles.gameName, { color: colors.text }]}>Didn't Provide?</Text>
                                    <Text style={[styles.gameModes, { color: colors.subText }]}>
                                        Report issue if creator didn't provide game credentials even after 10 minutes of confirmation.
                                    </Text>
                                </View>

                                <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                            </View>
                        </Pressable>
                    )
                }


                <Pressable
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'mistake_credentials', game_name, game_mode })}  // Pass game_name and game_mode
                >
                    <View style={styles.cardContent}>

                        <View style={styles.gameInfo}>
                            <Text style={[styles.gameName, { color: colors.text }]}>Wrong Credentials?</Text>
                            <Text style={[styles.gameModes, { color: colors.subText }]}>
                                {isCreator ? "I've sent the wrong credentials (Mutual Agreement Required)." : "The creator sent the wrong credentials (Mutual Agreement Required)."}
                            </Text>
                        </View>

                        <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                    </View>
                </Pressable>
                <Pressable
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'offline', game_name, game_mode })}  // Pass game_name and game_mode
                >
                    <View style={styles.cardContent}>

                        <View style={styles.gameInfo}>
                            <Text style={[styles.gameName, { color: colors.text }]}>Offline/Connection Lost</Text>
                            <Text style={[styles.gameModes, { color: colors.subText }]}>
                                Report issue if opponent went offline or lost connection during the match (Mutual Agreement Required).
                            </Text>
                        </View>

                        <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                    </View>
                </Pressable>

                {/* Report & Block User Section - Only show when there's an opponent */}
                {opponent && (
                    <Pressable
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        activeOpacity={0.8}
                        onPress={() => {
                            // Navigate to ReportUser screen with opponent and game info
                            navigation.navigate('reportUser', {
                                user: {
                                    id: opponent.id || opponent.participant_id,
                                    name: opponent.full_name || opponent.name || 'Unknown User'
                                },
                                gameInfo: {
                                    id: challenge_id,
                                    name: game_name,
                                    mode: game_mode
                                }
                            });
                        }}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.gameInfo}>
                                <Text style={[styles.gameName, { color: colors.text }]}>Report & Block User</Text>
                                <Text style={[styles.gameModes, { color: colors.subText }]}>
                                    Report {isCreator ? 'opponent' : 'creator'} for inappropriate behavior, profile violations, or cheating.
                                </Text>
                            </View>

                             <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                        </View>
                    </Pressable>
                )}
            </View>

        </SafeAreaView>
    )
}

export default SelectIssue

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        height: 200,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '400',
    },
    listContainer: {
        padding: 10,
    },
    card: {
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 0,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    gameInfo: {
        flex: 1,
    },
    gameName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    gameModes: {
        fontSize: 14,
    },
})