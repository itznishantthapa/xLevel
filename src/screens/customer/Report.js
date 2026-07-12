import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, Image, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { AppIcon } from '../../components/common/AppIcon';
import { Flag01Icon, ImageAdd01Icon, CheckIcon, InformationCircleIcon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-simple-toast';
import { CreateGameLayout } from '../../component/customer/createGame';
import { useCreateReport } from '../../queries/useMutation/useCreateReport';
import { ReportAPI } from '../../api/reportApi';
import { useAuthStore } from '../../store/authStore';
import { spacing, iconSize, fontSize, radius } from '../../theme/typography';

const REPORT_TYPES = [
    { id: 'fairness', label: 'Check Fairness', description: 'Detect & ban unfair opponent' },
    { id: 'game_issue', label: 'Game Issue', description: 'Report a problem during the match' },
    { id: 'refund_agreement', label: 'Refund Agreement', description: 'Request a mutual refund agreement' },
];

const REPORT_DETAILS = {
  game_issue:
    'Tapai ko match ma k-kasto problem aako chha hami lai explain garnus and screenshots pni dinu hos. All 3 screenshots required.\n[ False information may result in -20 points ]',
  refund_agreement:
    'Both players le Refund Agreement garnu vyo vni entry fee refund paunu huncha instantly.\n[ Notification & Guide will be delivered to your opponent after you submit the request ]',
  fairness:
    'Please check the fairness of your opponent before or after the match. If unusual activity is found, we will ban your opponent and refund your entry fee instantly.',
};

const FAIRNESS_STEP_DELAY_MS = 3000;
const FAIRNESS_NAV_DELAY_MS = 3000;

const FAIRNESS_STEPS = {
  actionTaken: [
    'Checking fairness...',
    'Checking device activity...',
    'Checking player activity...',
    'Panel detected...',
    'Banning player...',
    'Refunding your entry fee...',
  ],
  noAction: [
    'Checking fairness...',
    'Checking device activity...',
    'Checking player activity...',
    'Seems like fair opponent...',
    'No action taken...',
    'Thank you for checking fairness!',
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Report = ({ route }) => {
    const navigation = useNavigation();
    const { isLight } = useThemeStore();
    const { game } = route.params;
    const { mutateAsync: createReport } = useCreateReport();

    // State management
    const [reportType, setReportType] = useState('fairness');
    const [description, setDescription] = useState('');
    const [evidence1, setEvidence1] = useState(null);
    const [evidence2, setEvidence2] = useState(null);
    const [evidence3, setEvidence3] = useState(null);
    const [imageResult1, setImageResult1] = useState(null);
    const [imageResult2, setImageResult2] = useState(null);
    const [imageResult3, setImageResult3] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFairnessBusy, setIsFairnessBusy] = useState(false);
    const [isFairnessChecking, setIsFairnessChecking] = useState(false);
    const [fairnessLoaderMessage, setFairnessLoaderMessage] = useState('Checking fairness...');
    const [previewImage, setPreviewImage] = useState(null);

    const colors = {
        background: isLight ? '#ffffff' : '#000000',
        cardBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
        inputBackground: isLight ? '#f5f5f5' : '#1a1a1a',
        text: isLight ? '#000000' : '#ffffff',
        textSecondary: isLight ? 'rgba(51, 51, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        textTertiary: isLight ? '#666666' : '#999999',
        border: isLight ? '#eaeaea' : 'rgba(255, 255, 255, 0.3)',
        selected: isLight ? '#000000' : '#ffffff',
        unselected: isLight ? '#cccccc' : '#666666',
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setIsFairnessChecking(false);
            setIsFairnessBusy(false);
        });

        return unsubscribe;
    }, [navigation]);

 

    // Image picker function
    const pickImage = async (setEvidence, setImageResult) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                quality: 1,
            });

            if (!result.canceled) {
                setImageResult(result.assets[0]);
                setEvidence(result.assets[0].uri);
            }
        } catch (error) {
            Toast.show("Unable to pick image", Toast.SHORT);
        }
    };

    // Submit handler
    const runFairnessStepSequence = async (actionTaken) => {
        const steps = actionTaken ? FAIRNESS_STEPS.actionTaken : FAIRNESS_STEPS.noAction;

        for (const step of steps) {
            setFairnessLoaderMessage(step);
            await sleep(FAIRNESS_STEP_DELAY_MS);
        }
    };

    const handleCheckFairness = async () => {
        if (!game?.id) {
            return;
        }

        setIsFairnessBusy(true);

        try {
            const data = await ReportAPI.checkPlayerDeviceActivity({ challenge_id: game.id });

            setIsFairnessChecking(true);
            setFairnessLoaderMessage('Checking fairness...');
            await runFairnessStepSequence(Boolean(data?.action_taken));

            if (data?.action_taken) {
                await Promise.all([
                    useAuthStore.getState().get_user(),
                    sleep(FAIRNESS_NAV_DELAY_MS),
                ]);
                navigation.navigate('thanks', {
                    subtitle: 'Thank you for supporting fair play!',
                    hideDescription: true,
                    hideBackInstruction: true,
                    returnToHome: true,
                });
                return;
            }

            setIsFairnessChecking(false);
        } catch (error) {
            Toast.show(error?.message || 'Failed to check fairness', Toast.SHORT);
        } finally {
            setIsFairnessBusy(false);
        }
    };

    const handleSubmit = async () => {
        if (reportType === 'fairness') {
            await handleCheckFairness();
            return;
        }

        if (!reportType) {
            Toast.show("Please select a report type", Toast.SHORT);
            return;
        }

        if (reportType === 'game_issue') {
            if (!description.trim()) {
                Toast.show("Please provide a description of the issue", Toast.SHORT);
                return;
            }
            if (!evidence1 || !evidence2 || !evidence3) {
                Toast.show("Please upload all 3 evidence screenshots", Toast.SHORT);
                return;
            }
        }

        if (!game?.id) {
            Toast.show('Invalid game data', Toast.SHORT);
            return;
        }

        setIsLoading(true);

        try {
            // Prepare form data for API call
            const formData = new FormData();
            formData.append('challenge_id', game.id);
            formData.append('report_type', reportType);

            // Append description for game_issue
            if (reportType === 'game_issue') {
                formData.append('description', description.trim());
            }

            // Append images for game_issue
            if (reportType === 'game_issue') {
                if (imageResult1) {
                    formData.append('evidence_1', {
                        uri: evidence1,
                        name: 'evidence1.jpg',
                        type: imageResult1.mimeType || 'image/jpeg'
                    });
                }
                if (imageResult2) {
                    formData.append('evidence_2', {
                        uri: evidence2,
                        name: 'evidence2.jpg',
                        type: imageResult2.mimeType || 'image/jpeg'
                    });
                }
                if (imageResult3) {
                    formData.append('evidence_3', {
                        uri: evidence3,
                        name: 'evidence3.jpg',
                        type: imageResult3.mimeType || 'image/jpeg'
                    });
                }
            }


            await createReport(formData);
            Toast.show('Report submitted successfully', Toast.LONG);
            navigation.goBack();
        } catch (error) {
            Toast.show(error?.message || 'Failed to submit report', Toast.SHORT);
        } finally {
            setIsLoading(false);
        }
    };

    // Game info display component
    const GameInfoHeader = () => (
        <View style={styles.infoRow}>
            <View style={[styles.infoCard, styles.infoCardGame, { backgroundColor: colors.cardBackground }]}>
                <AppIcon icon={Flag01Icon} size={iconSize.md} color={colors.text} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoTitle, { color: colors.textTertiary }]}>
                        Game
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                    {game?.game?.name || 'Game'} · {game?.game?.game_mode || 'Mode'}
                    </Text>
    
                </View>
            </View>

            <View style={[styles.infoCard, styles.infoCardMatch, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoTitle, { color: colors.textTertiary }]}>
                        Match ID
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                        #{game?.id || 'N/A'}
                    </Text>
                </View>
            </View>
        </View>
    );

    // Image picker button component
    const ImagePickerButton = ({ evidence, onPress, title }) => (
        <View style={styles.imagePickerSection}>
            <Pressable
                style={[
                    styles.imagePickerButton,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        height: evidence ? 100 : 140,
                    }
                ]}
                onPress={() => {
                    if (evidence) {
                        setPreviewImage(evidence);
                    } else {
                        onPress();
                    }
                }}
            >
                {evidence ? (
                    <View style={styles.selectedImageContainer}>
                        <Image
                            source={{ uri: evidence }}
                            style={styles.selectedImage}
                            resizeMode="cover"
                        />
                        <Pressable onPress={onPress}>
                            <Text style={[styles.imagePickerActionText, { color: colors.textSecondary }]}>
                                Change screenshot
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <AppIcon icon={ImageAdd01Icon} size={iconSize.xl} color={colors.textTertiary} />
                        <Text style={[styles.imagePickerText, { color: colors.textSecondary, marginTop: 8 }]}>
                            {title}
                        </Text>
                        <Text style={[styles.imagePickerHint, { color: colors.textTertiary }]}>
                            Tap to upload
                        </Text>
                    </View>
                )}
            </Pressable>
        </View>
    );

    const renderReportTypeOption = (type, index) => {
        const isSelected = reportType === type.id;
        const isLast = index === REPORT_TYPES.length - 1;

        return (
            <Pressable
                key={type.id}
                style={[
                    styles.reportTypeOption,
                    {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : 1,
                    }
                ]}
                onPress={() => setReportType(type.id)}
            >
                <View style={styles.reportTypeContent}>
                    <View style={[
                        styles.radioButton,
                        {
                            borderColor: isSelected ? colors.selected : colors.unselected,
                            backgroundColor: isSelected ? colors.selected : 'transparent',
                        }
                    ]}>
                        {isSelected && (
                            <AppIcon icon={CheckIcon} size={iconSize.xs} color={isLight ? '#ffffff' : '#000000'} />
                        )}
                    </View>

                    <View style={styles.reportTypeTextWrap}>
                        <Text style={[styles.reportTypeLabel, { color: colors.text }]}>
                            {type.label}
                        </Text>
                        <Text style={[styles.reportTypeDescription, { color: colors.textSecondary }]}>
                            {type.description}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    const submitButtonTitle = reportType === 'fairness' ? 'Check Fairness' : 'Submit Report';
    const loaderMessage = isFairnessChecking
        ? fairnessLoaderMessage
        : 'Submitting report...';
    const isSubmitDisabled = isLoading || isFairnessBusy || isFairnessChecking;

    return (
        <>
            <CreateGameLayout
                title="Report Match"
                isLight={isLight}
                isLoading={isLoading || isFairnessChecking}
                isFormValid={!isSubmitDisabled}
                onSubmit={handleSubmit}
                buttonTitle={submitButtonTitle}
                loaderMessage={loaderMessage}
            >
                <View style={styles.container}>
                    <GameInfoHeader />

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Report type
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                            Choose how you want to report this match
                        </Text>
                    </View>

                    <View style={[styles.reportTypeList, { backgroundColor: colors.cardBackground }]}>
                        {REPORT_TYPES.map((type, index) => renderReportTypeOption(type, index))}
                    </View>

                    <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.detailsHeader}>
                            <AppIcon icon={AlertCircleIcon} size={iconSize.md} color={colors.text} />
                            <Text style={[styles.detailsTitle, { color: colors.text }]}>
                                What happens next
                            </Text>
                        </View>
                        <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                            {REPORT_DETAILS[reportType]}
                        </Text>
                    </View>

                    {reportType === 'game_issue' && (
                        <>
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Description
                                </Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    Explain the issue in detail
                                </Text>
                            </View>

                            <View style={[
                                styles.descriptionContainer,
                                {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.border,
                                }
                            ]}>
                                <TextInput
                                    style={[styles.descriptionInput, { color: colors.text }]}
                                    placeholder="Describe the issue in detail..."
                                    placeholderTextColor={colors.textTertiary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Evidence
                                </Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                                    Upload all 3 screenshots
                                </Text>
                            </View>

                            <ImagePickerButton
                                evidence={evidence1}
                                onPress={() => pickImage(setEvidence1, setImageResult1)}
                                title="Screenshot 1"
                            />
                            <ImagePickerButton
                                evidence={evidence2}
                                onPress={() => pickImage(setEvidence2, setImageResult2)}
                                title="Screenshot 2"
                            />
                            <ImagePickerButton
                                evidence={evidence3}
                                onPress={() => pickImage(setEvidence3, setImageResult3)}
                                title="Screenshot 3"
                            />
                        </>
                    )}


                </View>
            </CreateGameLayout>

            {/* Image preview modal */}
            <Modal
                visible={!!previewImage}
                transparent={true}
                statusBarTranslucent={true}
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <StatusBar
                    translucent
                    backgroundColor="rgba(0,0,0,0.9)"
                    barStyle="light-content"
                />

                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    activeOpacity={1}
                    onPressOut={() => setPreviewImage(null)}
                >
                    <Image
                        source={{ uri: previewImage }}
                        style={{ width: "90%", height: "70%", resizeMode: "contain" }}
                    />
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    infoCard: {
        flexDirection: 'row',
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
    },
    infoCardGame: {
        flex: 1,
        minWidth: 0,
    },
    infoCardMatch: {
        width: 96,
        flexShrink: 0,
    },
    infoTextContainer: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    infoTitle: {
        fontSize: fontSize.sm,
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: fontSize.base,
        fontWeight: '600',
        lineHeight: 18,
    },
    infoValueSecondary: {
        fontSize: fontSize.sm,
        fontWeight: '500',
        lineHeight: 16,
        marginTop: 2,
    },
    section: {
        gap: spacing.xs,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        lineHeight: 22,
    },
    sectionSubtitle: {
        fontSize: fontSize.base,
        lineHeight: 18,
    },
    reportTypeList: {
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    reportTypeOption: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    reportTypeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportTypeTextWrap: {
        flex: 1,
        gap: 2,
    },
    reportTypeLabel: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    reportTypeDescription: {
        fontSize: fontSize.sm,
        lineHeight: 16,
    },
    detailsCard: {
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.md,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    detailsTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    detailsText: {
        fontSize: fontSize.base,
        lineHeight: 20,
    },
    descriptionContainer: {
        width: '100%',
        borderWidth: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
        padding: spacing.lg,
        minHeight: 120,
    },
    descriptionInput: {
        flex: 1,
        fontSize: fontSize.md,
        lineHeight: 20,
        textAlignVertical: 'top',
        fontWeight: '500',
    },
    imagePickerSection: {
        marginBottom: spacing.md,
    },
    imagePickerButton: {
        width: '100%',
        borderWidth: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
    },
    selectedImageContainer: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
    },
    selectedImage: {
        width: 70,
        height: 70,
        borderRadius: radius.sm,
    },
    imagePickerText: {
        fontSize: fontSize.md,
        fontWeight: '500',
        textAlign: 'center',
    },
    imagePickerHint: {
        fontSize: fontSize.sm,
        textAlign: 'center',
    },
    imagePickerActionText: {
        fontSize: fontSize.base,
        fontWeight: '500',
    },

});

export default Report;
