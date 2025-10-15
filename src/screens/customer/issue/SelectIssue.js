
import { StyleSheet, Text, View, FlatList, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons'
import { useThemeStore } from '../../../store/themeStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGameRules } from '../../../queries/useGameRules'
import { useAuthStore } from '../../../store/authStore'
import AppHeader from '../header/AppHeader'
import { ScrollView } from 'react-native-gesture-handler'

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
                title={'Report & Refund'}
            />


            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ marginTop: 10, paddingHorizontal: 10 }}>


                {
                    !isCreator && game_mode !== 'Lone Wolf' && (
                        <Pressable
                            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('dropIssue', { challenge_id, issueType: 'mistake_setting', game_name, game_mode })}  // Pass game_name and game_mode
                        >
                            <View style={styles.cardContent}>

                                <View style={styles.gameInfo}>
                                    <Text style={[styles.gameName, { color: colors.text }]}>Mistake Game Settings</Text>
                                    <Text style={[styles.gameModes, { color: colors.subText }]}>
                                        The creator is only allowed to change the specific game settings mentioned in the app. If the creator modifies or adds restrictions to make the game unfair or in their favor, you can provide a screenshot of the game settings as proof. We will take action against the creator — you will receive 60% of the winning amount, and the creator will receive 40%.
                                        Example: If the entry fee is 100 and the winning amount is 180, you’ll get 108 points, and the creator will get 72 points (40% of the winning amount).
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
                            </View>
                        </Pressable>
                    )
                }



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
                                        If your confirmed opponent doesn’t join within 5 minutes after the credentials (ID, password, team code, or URL) are provided, you can report a “Didn’t Join” issue. You will receive 60% of the winning amount.
                                        Example: If the entry fee is 100 and the winning amount is 180, you’ll get 108 points, and your opponent will get 72 points (40% of the winning amount) (Mutual Agreement Not Required).
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
                                        If the match creator doesn’t provide the credentials (ID, password, team code, or URL) within 10 minutes after confirming opponent(You), you can report a “Didn’t Provide” issue. You’ll receive 60% of the winning amount, and the creator will get 40%.
                                        Example: If the entry fee is 100 and the winning amount is 180, you’ll get 108 points, and creator will get 72 points (40% of the winning amount) (Mutual Agreement Not Required).
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
                                {isCreator ? "If you’ve sent the wrong credentials even after using both resend attempts, you can report a “Wrong Credentials” issue. We’ll notify your opponent to report the same issue. Once both reports are confirmed, you and your opponent will each get your full entry points back. Example: If the entry point is 100, both players will receive 100 points each (Mutual Agreement Required)." : "If the creator sends the wrong credentials and you’re unable to join, you can report a “Wrong Credentials” issue. We’ll notify the creator to resend or to confirm the same issue. Once both reports are verified, you and the creator will each receive your full entry points back. Example: If the entry point is 100, both players will receive 100 points each (Mutual Agreement Required)."}
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
                                During the match, if both players are unable to play due to going offline or losing connection, you can report an “Offline/Connection Lost” issue to get 50% of the winning amount.
                                Note: After you report this issue, we will notify your opponent to report the same issue so that both of you can get your points back. Both players must report the issue; if only one reports, no refund will be issued (Mutual Agreement Required).
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
            </ScrollView>

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