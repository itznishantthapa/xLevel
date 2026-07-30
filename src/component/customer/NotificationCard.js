import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  GameController03Icon,
  StoreIcon,
  Notification01Icon,
} from '@hugeicons/core-free-icons';
import AppIcon, { PointsIcon } from '../../components/common/AppIcon';
import { iconSize } from '../../theme/typography';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';
import { useThemeStore } from '../../store/themeStore';
import { ChallengeAPI } from '../../api/challengeApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timeAgo } from '../matchcard/index/timeFormatter';
import { RoomCredentialRow, RoomCredentialsBlock } from '../matchcard/RoomCredentialRow';

/**
 * Constants for notification types and their configurations
 */
const NOTIFICATION_TYPES = {
    GAME: 'game',
    CREDITED: 'credited',
    NORMAL: 'normal',
    STORE: 'store'
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



    /**
     * Configuration for different notification types
     * Memoized to prevent recreation on each render
     */
    const notificationConfig = useMemo(() => ({
        [NOTIFICATION_TYPES.GAME]: {
            title: 'Game Invitation',
            bgColor: isLight ? '#A855F7' : 'rgba(109, 140, 255, 0.2)',
            icon: <AppIcon icon={GameController03Icon} size={iconSize.sm} color={isLight ? "#ffffff" : "#6d8cff"} />
        },
        [NOTIFICATION_TYPES.CREDITED]: {
            title: 'Game Point',
            bgColor: isLight ? '#14B8A6' : 'rgba(32, 201, 151, 0.2)',
            icon: <PointsIcon size={iconSize.sm} color={isLight ? "#ffffff" : "#20c997"} />
        },
        [NOTIFICATION_TYPES.STORE]: {
            title: 'Store',
            bgColor: isLight ? '#6366F1' : 'rgba(99, 102, 241, 0.2)',
            icon: <AppIcon icon={StoreIcon} size={iconSize.sm} color={isLight ? "#ffffff" : "#6366F1"} />
        },
        [NOTIFICATION_TYPES.NORMAL]: {
            title: 'Notification',
            bgColor: isLight ? '#F97316' : 'rgba(255, 152, 0, 0.2)',
            icon: <AppIcon icon={Notification01Icon} size={iconSize.sm} color={isLight ? "#ffffff" : "#ffb74d"} />
        }
    }), [isLight]);

    // Get current notification configuration
    const config = notificationConfig[notificationType] || notificationConfig[NOTIFICATION_TYPES.NORMAL];

    /**
     * Renders room details section for game notifications
     */
    const RoomDetails = () => {
        if (!notification?.room) return null;

        const { room_id, room_pass, team_code, lobby_id } = notification.room;

        // Helper to render a single info row
        const renderInfoRow = (label, value, onPressFn) => (
            <RoomCredentialRow
                label={label}
                value={value}
                onPress={onPressFn}
                isLight={isLight}
            />
        );

        return (
            <RoomCredentialsBlock isLight={isLight}>
                {room_id && renderInfoRow('ID', room_id, () => handleRoomCopy(room_id))}
                {room_pass && renderInfoRow('PASS', room_pass, () => copyToClipboard(room_pass))}
                {team_code && renderInfoRow('TEAMCODE', team_code, () => handleRoomCopy(team_code))}
                {lobby_id && renderInfoRow('LOBBY ID', lobby_id, () => handleRoomCopy(lobby_id))}
            </RoomCredentialsBlock>
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
                    <View style={[
                        styles.iconContainer, 
                        { backgroundColor: config.bgColor },
                        // Add shadow only in light mode
                        isLight && {
                            elevation: 6,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.35,
                            shadowRadius: 4.5,
                        }
                    ]}>
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
    buttonLine: {
        width: '100%',
        height: 1,
        marginVertical: 12,
    },
});

export default React.memo(NotificationCard);