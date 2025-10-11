import React from "react"
import { View, Text, ScrollView, Pressable, Image } from "react-native"

const OpponentSheetContent = React.memo(({ payload, isDark, insets, handleConfirm }) => {
    const opponent = payload.opponent
    const theGame = payload.opponent?.theGame




    // Get game-specific data to display
    const getGameSpecificInfo = () => {
        switch (theGame) {
            case "chess":
                return [
                    { label: "Game Name", value: opponent.game_name },
                    { label: "Games Played", value: opponent.total_games_played ? `${opponent.total_games_played}+` : "0" },
                    { label: "Rapid Rating", value: opponent.rapid_rating || "0" },
                    { label: "Blitz Rating", value: opponent.blitz_rating || "0" },
                    { label: "Bullet Rating", value: opponent.bullet_rating || "0" },
                ]

            case "efootball":
                return [
                    { label: "UID", value: opponent.game_uid },
                    { label: "Game Name", value: opponent.game_name },
                    { label: "Current Division", value: opponent.current_division || "0" },
                    { label: "Highest Division", value: opponent.highest_division || "0" },
                    { label: "Courtesy Rating", value: opponent.courtesy_rating || "0" },
                ]

            case "free fire":
            case "pubg":
            default:
                return [
                    { label: "UID", value: opponent.game_uid },
                    { label: "Game Name", value: opponent.game_name },
                    { label: "Level", value: opponent.game_level || opponent.level || "0" },
                ]
        }
    }

    const gameInfo = getGameSpecificInfo()

    return (
        <View style={styles.content}>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Header Section - Compact Profile */}
                <View style={styles.headerSection}>
                    {opponent.profile_picture ? (
                        <Image source={{ uri: opponent.profile_picture }} style={styles.avatar} />
                    ) : (
                        <View
                            style={[
                                styles.avatarPlaceholder,
                                {
                                    backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                                    borderColor: isDark ? "#404040" : "#e0e0e0",
                                },
                            ]}
                        />
                    )}

                    <View style={styles.headerInfo}>
                        <Text style={[styles.playerName, { color: isDark ? "#ffffff" : "#1a1a1a" }]}>
                            {opponent.full_name}
                        </Text>
                        <Text style={[styles.gameLabel, { color: isDark ? "#888888" : "#666666" }]}>
                            {/* {theGame ? theGame.charAt(0).toUpperCase() + theGame.slice(1) : "Game"} */}
                            {theGame === 'chess' ? 'Chess.com' : theGame === 'efootball' ? 'eFootball' : theGame === 'free fire' ? 'Free Fire' : theGame === 'pubg' ? 'PUBG' : 'Game'}
                        </Text>
                    </View>
                </View>

                {/* Game Details Section - Tech Style */}
                <View style={styles.detailsSection}>
                    {gameInfo.map((info, index) => (
                        <View key={`${info.label}-${index}`} style={styles.techCardWrapper}>
                            {/* Corner Accents */}
                            <View style={[styles.cornerTopLeft, {
                                borderTopColor: isDark ? '#ffffff' : '#1a1a1a',
                                borderLeftColor: isDark ? '#ffffff' : '#1a1a1a',
                            }]} />
                            <View style={[styles.cornerBottomRight, {
                                borderBottomColor: isDark ? '#ffffff' : '#1a1a1a',
                                borderRightColor: isDark ? '#ffffff' : '#1a1a1a',
                            }]} />
                            
                            {/* Main Content */}
                            <View style={[styles.techCard, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                            }]}>
                                {/* Label Section with Angled Clip */}
                                <View style={styles.labelContainer}>
                                    <View style={[styles.labelBg, {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                    }]} />
                                    <Text style={[styles.techLabel, { 
                                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)' 
                                    }]}>
                                        {info.label.toUpperCase()}
                                    </Text>
                                </View>
                                
                                {/* Value Section */}
                                <View style={styles.valueContainer}>
                                    <Text style={[styles.techValue, { 
                                        color: isDark ? '#ffffff' : '#000000' 
                                    }]}>
                                        {info.value}
                                    </Text>
                                    {/* Tech Line Accent */}
                                    <View style={[styles.valueLine, {
                                        backgroundColor: isDark ? '#ffffff' : '#1a1a1a',
                                    }]} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Action Section */}
            <View style={[styles.actionSection, { paddingBottom: Math.max(12, insets.bottom + 10 || 0) }]}>
                {payload.isConfirmed ? (
                    <View style={[styles.statusContainer, {
                        // backgroundColor: isDark ? "#1a3d1a" : "#f0f8f0",
                        borderColor: isDark ? "#ffffff" : "#000000"
                    }]}>
                        <Text style={[styles.statusText, { color: isDark ? "#ffffff" : "#000000" }]}>
                            Opponent Confirmed
                        </Text>
                    </View>
                ) : payload.gameStatus === "completed" || payload.gameStatus === "cancelled" ? (
                    <View style={[styles.statusContainer, {
                        borderColor: isDark ? "#ffffff" : "#000000"
                    }]}>
                        <Text style={[styles.statusText, { color: isDark ? "#ffffff" : "#000000" }]}>
                            {payload.gameStatus === "completed" ? "Match Completed" : "Match Cancelled"}
                        </Text>
                    </View>
                ) : payload.gameStatus === "expired" ? (
                    <View style={[styles.statusContainer, {
                        borderColor: isDark ? "#ffffff" : "#000000"
                    }]}>
                        <Text style={[styles.statusText, { color: isDark ? "#ffffff" : "#000000" }]}>
                            Match Expired
                        </Text>
                    </View>
                ) : (
                    <Pressable
                        style={[styles.confirmButton, {
                            backgroundColor: isDark ? "#ffffff" : "#1a1a1a"
                        }]}
                        onPress={handleConfirm}
                    >
                        <Text style={[styles.confirmButtonText, {
                            color: isDark ? "#1a1a1a" : "#ffffff"
                        }]}>
                            Confirm Opponent
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
})

const styles = {
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollArea: {
        flex: 1,
    },
    headerSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 20,
        paddingBottom: 16,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
        justifyContent: "center",
    },
    playerName: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 2,
    },
    gameLabel: {
        fontSize: 13,
        fontWeight: "500",
        // textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    detailsSection: {
        marginBottom: 16,
        paddingHorizontal: 0,
        gap: 8,
    },
    techCardWrapper: {
        position: 'relative',
        marginHorizontal: 2,
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 12,
        height: 12,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        zIndex: 2,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        zIndex: 2,
    },
    techCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        overflow: 'hidden',
    },
    labelContainer: {
        position: 'relative',
        paddingVertical: 10,
        paddingLeft: 16,
        paddingRight: 20,
        minWidth: '45%',
    },
    labelBg: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        transform: [{ skewX: '-8deg' }],
    },
    techLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1.2,
        zIndex: 1,
    },
    valueContainer: {
        position: 'relative',
        paddingVertical: 10,
        paddingRight: 16,
        paddingLeft: 12,
        flex: 1,
        alignItems: 'flex-end',
    },
    techValue: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        zIndex: 1,
    },
    valueLine: {
        position: 'absolute',
        left: 0,
        bottom: 4,
        width: 20,
        height: 2,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "right",
        flex: 1,
    },
    actionSection: {
        paddingHorizontal: 4,
    },
    statusContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 15,
        fontWeight: "600",
    },
    confirmButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: "600",
    },
}

export default OpponentSheetContent