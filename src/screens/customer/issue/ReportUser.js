import { StyleSheet, Text, View, Pressable, TextInput, Alert, Keyboard, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import { useThemeStore } from '../../../store/themeStore'
import { CreateGameLayout } from '../../../component/customer/createGame'
import { useAuthStore } from '../../../store/authStore'
import { useBottomSheet } from '../../../context/BottomSheetContext'
import { useNavigation } from '@react-navigation/native'
import Toast from "react-native-simple-toast"
import { blockUser } from '../../../api/blockApi'
import { ShakeText } from '../../../component/customer/animation'

const ReportUser = ({ route }) => {
    const { isLight } = useThemeStore()
    const [selectedReason, setSelectedReason] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [keyboardVisible, setKeyboardVisible] = useState(false)
    const { user } = useAuthStore()
    const { showConfirmSheet } = useBottomSheet()
    const navigation = useNavigation()
    const scrollViewRef = useRef(null)
    const shakeRef = useRef(null)

    // Get reported user info and game info from route params
    const reportedUser = route?.params?.user || {}
    const gameInfo = route?.params?.gameInfo || {}

    const reportReasons = [
        { id: '1', label: 'Sensitive Picture' },
        { id: '2', label: 'Inappropriate Name' },
        { id: '3', label: 'Inappropriate Game Name' },
        { id: '4', label: 'Abnormal Player/Cheater' },
    ]

    const colors = {
        background: isLight ? "#eef0f2" : "#000000",
        cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
        text: isLight ? "#000000" : "#ffffff",
        textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
        textTertiary: isLight ? "#666666" : "#999999",
        border: isLight ? "#eaeaea" : "rgba(255, 255, 255, 0.3)",
        destructive: "#FF4444",
        warning: "#FF9500",
        radioSelected: isLight ? "#000000" : "#ffffff",
        radioUnselected: isLight ? "#cccccc" : "#666666",
    }

    const handleReasonSelect = (reasonId) => {
        setSelectedReason(reasonId)
    }

    // Keyboard event listeners
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (event) => {
                setKeyboardVisible(true)
                scrollViewRef.current?.scrollTo({
                    y: Platform.OS === "ios" ? 300 : 500,
                    animated: true,
                })
            },
        )

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                setKeyboardVisible(false)
                scrollViewRef.current?.scrollTo({
                    y: 0,
                    animated: true,
                })
            },
        )

        return () => {
            keyboardWillShow.remove()
            keyboardWillHide.remove()
        }
    }, [])

    const handleReportUser = async () => {
        if (!selectedReason) {
            shakeRef.current?.shake()
            return
        }

        // Confirm sheet
        showConfirmSheet({
            title: "Report & Block User?",
            message: `Are you sure you want to report and block ${reportedUser.name || 'this user'}? This action will be reviewed by our moderation team.`,
            confirmText: "Report & Block",
            cancelText: "Cancel",
            isDestructive: true,
            onConfirm: async () => {
                setIsLoading(true);

                try {
                    // Create simplified payload
                    const payload = {
                        reportedUserId: reportedUser.id,
                        reason: reportReasons.find(reason => reason.id === selectedReason)?.label
                    };



                    await blockUser(payload);


                    navigation.replace("thanks")

                } catch (error) {
                    Toast.show(error.message || 'Could not report user. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    const renderReasonOption = (reason, index) => {
        const isSelected = selectedReason === reason.id
        const isLast = index === reportReasons.length - 1

        return (
            <Pressable
                key={reason.id}
                style={[
                    styles.reasonOption,
                    {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : 1
                    }
                ]}
                onPress={() => handleReasonSelect(reason.id)}
            >
                <View style={styles.reasonContent}>
                    <View style={[
                        styles.radioButton,
                        {
                            borderColor: isSelected ? colors.radioSelected : colors.radioUnselected,
                            backgroundColor: isSelected ? colors.radioSelected : 'transparent'
                        }
                    ]}>
                        {isSelected && (
                            <MaterialIcons
                                name="check"
                                size={14}
                                color={isLight ? "#ffffff" : "#000000"}
                            />
                        )}
                    </View>
                    <Text style={[styles.reasonText, { color: colors.text }]}>
                        {reason.label}
                    </Text>
                </View>
            </Pressable>
        )
    }

    return (
        <CreateGameLayout
            title="Report User"
            isLight={isLight}
            isLoading={isLoading}
            onSubmit={handleReportUser}
            buttonTitle="Report & Block User"
            loaderMessage="Processing report..."
            scrollViewRef={scrollViewRef}
            keyboardVisible={keyboardVisible}
        >
            <View style={styles.container}>
                {/* Warning Header */}
                <View style={[styles.warningContainer, { backgroundColor: colors.cardBackground }]}>
                   <FontAwesome5 name="exclamation-circle" size={22} color={isLight ? "#000000" : "#fff"} />
                    <View style={styles.warningTextContainer}>
                        <Text style={[styles.warningTitle, { color: colors.text }]}>
                            Report User Violation
                        </Text>
                        <Text style={[styles.warningMessage, { color: colors.textSecondary }]}>
                            Once verified, users violating guidelines will be permanently banned from the application.
                        </Text>
                    </View>
                </View>

                {/* User Info and Game Context Section - Horizontal Layout */}
                {(reportedUser.name || gameInfo?.name) && (
                    <View style={styles.infoRow}>
                        {/* User Info Section */}
                        {reportedUser.name && (
                            <View style={[styles.infoCard, styles.userInfoContainer, { backgroundColor: colors.cardBackground }]}>
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoTitle, { color: colors.textTertiary }]}>
                                        Reporting
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                                        {reportedUser.name}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Game Context Section */}
                        {gameInfo?.name && (
                            <View style={[styles.infoCard, styles.gameInfoContainer, { backgroundColor: colors.cardBackground }]}>
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoTitle, { color: colors.textTertiary }]}>
                                        Game
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                                        {gameInfo.name} | {gameInfo.mode}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Reason Selection Section */}
                <View style={styles.section}>
                    <ShakeText ref={shakeRef}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            What is the violation?
                        </Text>
                    </ShakeText>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        Select the reason for reporting this user
                    </Text>
                </View>

                {/* Reason Options */}
                <View style={[styles.reasonsList, { backgroundColor: colors.cardBackground }]}>
                    {reportReasons.map((reason, index) => renderReasonOption(reason, index))}
                </View>

                {/* Additional Info */}
                <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
                    <MaterialIcons name="info" size={18} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        All reports are reviewed by our moderation team. False reports may result in action against your account.
                    </Text>
                </View>
            </View>
        </CreateGameLayout>
    )
}

export default ReportUser

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 20,
    },

    // Warning Section
    warningContainer: {
        flexDirection: 'row',
        padding: 14,
        alignItems: 'flex-start',
        gap: 12,
        borderRadius:12,
    },
    warningTextContainer: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    warningMessage: {
        fontSize: 12,
        lineHeight: 18,
    },

    // Horizontal Info Row
    infoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    infoCard: {
        flex: 1,
        flexDirection: 'row',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        gap: 10,
        minHeight: 56,
    },
    infoTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    infoTitle: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },

    // User Info Section (Updated for horizontal layout)
    userInfoContainer: {
        // Styles now inherited from infoCard
    },

    // Game Info Section (Updated for horizontal layout)  
    gameInfoContainer: {
        // Styles now inherited from infoCard
    },

    // Section Headers
    section: {
        gap: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    sectionSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },

    // Reason Options
    reasonsList: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    reasonOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    reasonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },

    // Info Section
    infoContainer: {
        flexDirection: 'row',
        padding: 14,
        alignItems: 'flex-start',
        gap: 10,
        borderBottomRightRadius:12,
        borderBottomLeftRadius:12,
    },
    infoText: {
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
})
