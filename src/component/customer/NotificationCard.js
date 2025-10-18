import { StyleSheet, Text, View, Pressable } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';
import { useThemeStore } from '../../store/themeStore';
import { ChallengeAPI } from '../../api/challengeApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timeAgo } from '../matchcard/index/timeFormatter';

/**
 * Constants for notification types and their configurations
 */
const NOTIFICATION_TYPES = {
    GAME: 'game',
    CREDITED: 'credited',
    NORMAL: 'normal'
};

/**
 * NotificationCard Component
 * Renders different types of notifications with appropriate styling and interactions
 * 
 * @param {Object} props
 * @param {Object} props.notification - The notification object containing type, message, and optional room details
 */
const NotificationCard = ({ notification }) => {
    const { isLight } = useThemeStore();
    const [isOneTimeClick, setIsOneTimeClick] = useState(false);
    // Determine notification type
    const notificationType = notification.notification_type;
    const challengeId = notification?.challenge?.challenge_id ?? notification?.challenge_id ?? notification?.challenge?.id ?? notification?.id;

    // Load once-per-challenge acceptance flag (same behavior as MyMatchCard)
    useEffect(() => {
        const loadAcceptOnce = async () => {
            if (!challengeId) return;
            try {
                const stored = await AsyncStorage.getItem(`accept_click_${challengeId}`);
                if (stored !== null) {
                    setIsOneTimeClick(stored === 'true');
                }
            } catch (_) {
                // silent fail
            }
        };
        loadAcceptOnce();
    }, [challengeId]);

    /**
     * Copies text to clipboard and shows a toast message
     * Handling the challenge_id for api call to notify user that opponent is comming.
     * @param {string} text - Text to copy and copy to sajilo haha...
     */
    const handleRoomCopy = async (text) => {
        if (!isOneTimeClick && challengeId) {
            try {
                // Persist first to prevent duplicate sends (mirrors MyMatchCard behavior)
                await AsyncStorage.setItem(`accept_click_${challengeId}`, 'true');
                setIsOneTimeClick(true);
            } catch (_) {
                // continue even if storage fails
            }

            try {
                await ChallengeAPI.updateOnChallenge({ challenge_id: challengeId, post_type: 'accepted' });
            } catch (_) {
                // silently ignore API errors to keep UX consistent with card
            }
        }
        Clipboard.setString(text);
        Toast.show('Copied!', Toast.SHORT);
    };

    /**
     * Copies text to clipboard and shows a toast message
     * @param {string} text - Text to copy
     */
    const copyToClipboard = (text) => {
      Clipboard.setString(text);
      Toast.show('Copied!', Toast.SHORT);
  };





    // /**
    //  * Formats the timestamp into a relative time string (e.g., "2 min ago")
    //  * @param {string} timestamp - ISO timestamp string
    //  * @returns {string} Formatted relative time string
    //  */
    // const formatTimeAgo = (timestamp) => {
    //     const date = new Date(timestamp);
    //     const now = new Date();
    //     const diffInSeconds = Math.floor((now - date) / 1000);
    //     const diffInMinutes = Math.floor(diffInSeconds / 60);
    //     const diffInHours = Math.floor(diffInMinutes / 60);
    //     const diffInDays = Math.floor(diffInHours / 24);

    //     if (diffInDays > 0) {
    //         return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    //     }
    //     if (diffInHours > 0) {
    //         return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    //     }
    //     if (diffInMinutes > 0) {
    //         return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    //     }
    //     return 'just now';
    // };

    /**
     * Configuration for different notification types
     * Memoized to prevent recreation on each render
     */
    const notificationConfig = useMemo(() => ({
        [NOTIFICATION_TYPES.GAME]: {
            title: 'Game Invitation',
            bgColor: isLight ? '#eef5ff' : 'rgba(46, 81, 255, 0.2)',
            icon: <MaterialCommunityIcons 
                name="gamepad-variant" 
                size={16} 
                color={isLight ? "#4263eb" : "#6d8cff"} 
            />
        },
        [NOTIFICATION_TYPES.CREDITED]: {
            title: 'Game Point Update',
            bgColor: isLight ? '#e6f9ee' : 'rgba(18, 184, 134, 0.2)',
            icon: <MaterialCommunityIcons 
                name="star-four-points-outline" 
                size={16} 
                color={isLight ? "#12b886" : "#20c997"} 
            />
        },
        [NOTIFICATION_TYPES.NORMAL]: {
            title: 'Notification',
            bgColor: isLight ? '#fff3e0' : 'rgba(255, 152, 0, 0.2)',
            icon: <Entypo 
                name="notification" 
                size={16} 
                color={isLight ? "#ff9800" : "#ffb74d"} 
            />
        }
    }), [isLight]);

    // Get current notification configuration
    const config = notificationConfig[notificationType] || notificationConfig[NOTIFICATION_TYPES.NORMAL];

    /**
     * Renders room details section for game notifications
     */
    const RoomDetails = () => {
        if (!notification?.room) return null;

        const { room_id, room_pass, team_code } = notification.room;

        // Helper to render a single info row
        const renderInfoRow = (label, value, onPressFn) => (
            <Pressable
                style={styles.roomDetail}
                onPress={onPressFn}
                activeOpacity={0.7}
            >
                <View
                    style={[
                        styles.roomInfoItem,
                        { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' },
                    ]}
                >
                    <Text style={{ color: isLight ? '#666666' : '#dadada' }}>{label}</Text>
                    <Text
                        style={[styles.roomInfoText, { color: isLight ? '#333333' : '#dadada' }]}
                        numberOfLines={1}
                    >
                        {value}
                    </Text>
                    <MaterialIcons
                        name="content-copy"
                        size={14}
                        color={isLight ? '#666666' : '#dadada'}
                    />
                </View>
            </Pressable>
        );

        return (
            <View style={styles.gameInfoContainer}>
                {/* Room ID */}
                {room_id && renderInfoRow('ID', room_id, () => handleRoomCopy(room_id))}

                {/* Room Password */}
                {room_pass && renderInfoRow('Pass', room_pass, () => copyToClipboard(room_pass))}

                {/* Team Code */}
                {team_code && renderInfoRow('Code', team_code, () => handleRoomCopy(team_code))}
            </View>
        );
    };

    return (
        <View style={styles.cardContainer}>
            <View style={[
                styles.card,
                { 
                    backgroundColor: isLight ? '#ffffff' : '#000000',
                    borderColor: isLight ? '#333333' : '#dadada',
                    borderWidth: 1.5
                }
            ]}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                        {config.icon}
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={[styles.notificationTitle, { color: isLight ? '#333333' : '#dadada' }]}>
                            {config.title}
                        </Text>
                        <Text style={[styles.timeAgo, { color: isLight ? '#666666' : '#dadada' }]}>
                            {/* {formatTimeAgo(notification.notification_created_at)} */}
                            {timeAgo(notification.notification_created_at)}
                        </Text>
                    </View>
                </View>

                {/* Message Section */}
                <Text style={[styles.message, { color: isLight ? '#333333' : '#dadada' }]}>
                    {notification.message}
                </Text>

                {/* Room Details Section (for game notifications) */}
                {notificationType === NOTIFICATION_TYPES.GAME && notification.room && <RoomDetails />}

                {/* Bottom Line */}
                <View style={[
                    styles.buttonLine,
                    { backgroundColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)' }
                ]}/>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 10,
        marginVertical: 8,
    },
    card: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
 
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeAgo: {
        fontSize: 12,
        fontWeight: '400',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
        fontWeight: '500',
    },
    gameInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    roomDetail: {
        flex: 1,
    },
    roomInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    roomInfoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        fontFamily: 'monospace',
    },
    buttonLine: {
        width: '100%',
        height: 1,
        marginVertical: 12,
    },
});

export default React.memo(NotificationCard);