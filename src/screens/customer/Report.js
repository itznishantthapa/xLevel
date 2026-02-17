import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, Image, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-simple-toast';
import { scaleWidth } from '../../utils/scaling';
import { CreateGameLayout, SectionTitle } from '../../component/customer/createGame';
import { useCreateReport } from '../../queries/useMutation/useCreateReport';

const Report = ({ route }) => {
    const navigation = useNavigation();
    const { isLight } = useThemeStore();
    const { game } = route.params;
    const { mutateAsync: createReport } = useCreateReport();

    // State management
    const [reportType, setReportType] = useState('game_issue'); // 'refund_agreement' or 'game_issue' - Default to game_issue
    const [description, setDescription] = useState('');
    const [evidence1, setEvidence1] = useState(null);
    const [evidence2, setEvidence2] = useState(null);
    const [evidence3, setEvidence3] = useState(null);
    const [imageResult1, setImageResult1] = useState(null);
    const [imageResult2, setImageResult2] = useState(null);
    const [imageResult3, setImageResult3] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        console.log('Game details:', game);
    }, [game]);

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
    const handleSubmit = async () => {
        if (!reportType) {
            Toast.show("Please select a report type", Toast.SHORT);
            return;
        }

        if (reportType === 'game_issue') {
            if (!description.trim()) {
                Toast.show("Please provide a description of the issue", Toast.SHORT);
                return;
            }
            if (!evidence1) {
                Toast.show("Please upload at least one evidence screenshot", Toast.SHORT);
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

            // Log payload for debugging
            console.log('Report Payload:', {
                challenge_id: game.id,
                report_type: reportType,
                ...(reportType === 'game_issue' && {
                    description: description.trim(),
                    evidence_1: evidence1 ? 'attached' : null,
                    evidence_2: evidence2 ? 'attached' : null,
                    evidence_3: evidence3 ? 'attached' : null,
                })
            });

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
        <View style={[styles.section]}>
            <View style={[styles.gameInfoContainer]}>
                <MaterialIcons name="flag" size={scaleWidth(20)} color={isLight ? "#333333" : "#ffffff"} />
                <View style={styles.gameInfoItem}>
                    <Text
                        style={[
                            styles.value,
                            {
                                color: isLight ? "#333333" : "#ffffff",
                                borderBottomColor: isLight ? "#000000" : "#ffffff",
                                marginLeft: 5
                            }
                        ]}
                    >
                        {game?.game?.name || "Game"}
                    </Text>
                </View>
                <View style={styles.gameInfoItem}>
                    <Text
                        style={[
                            styles.value,
                            {
                                color: isLight ? "#333333" : "#ffffff",
                                marginLeft: 5,
                                borderBottomColor: isLight ? "#000000" : "#ffffff"
                            }
                        ]}
                    >
                        {game?.game?.game_mode || "Mode"}
                    </Text>
                </View>
                <View style={[styles.gameInfoItem, { position: 'absolute', right: 10 }]}>
                    <Text
                        style={[
                            styles.value,
                            {
                                color: isLight ? "#333333" : "#ffffff",
                                marginLeft: 5,
                                borderBottomColor: isLight ? "#000000" : "#ffffff"
                            }
                        ]}
                    >
                        Reporting on Match #{game?.id || "N/A"}
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
                        backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
                        borderColor: isLight ? "#cccccc" : "#333333",
                        height: evidence ? 100 : 150,
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
                            <Text style={[
                                styles.imagePickerText,
                                { color: isLight ? "#666666" : "#cccccc" }
                            ]}>
                                Change Screenshot
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <MaterialIcons
                            name="add-photo-alternate"
                            size={32}
                            color={isLight ? "#666666" : "#999999"}
                        />
                        <Text style={[
                            styles.imagePickerText,
                            { color: isLight ? "#666666" : "#cccccc", marginTop: 8 }
                        ]}>
                            {title}
                        </Text>
                    </View>
                )}
            </Pressable>
        </View>
    );

    return (
        <>
            <CreateGameLayout
                title="Report Match"
                isLight={isLight}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                buttonTitle="Submit Report"
                loaderMessage="Submitting report..."
            >
                {/* Game Info */}
                <GameInfoHeader />

                {/* Report Type Selection Section */}
                <View style={styles.section}>
                    <SectionTitle
                        title="Report Type"
                        isLight={isLight}
                    />

                    <Text style={[
                        styles.subtitle,
                        { color: isLight ? '#666666' : '#cccccc' }
                    ]}>
                        Select the type of report you want to submit.
                    </Text>

                    {/* Report Type Buttons */}
                    <View style={styles.reportTypeContainer}>
                        <Pressable
                            style={[
                                styles.reportTypeButton,
                                {
                                    backgroundColor: reportType === 'game_issue'
                                        ? '#ff4444'
                                        : (isLight ? '#f5f5f5' : '#1a1a1a'),
                                    borderColor: reportType === 'game_issue' ? '#ff4444' : (isLight ? '#cccccc' : '#333333'),


                                }
                            ]}
                            onPress={() => setReportType('game_issue')}
                        >
                            <Text style={[
                                styles.reportTypeButtonText,
                                {
                                    color: reportType === 'game_issue'
                                        ? '#ffffff'
                                        : (isLight ? '#666666' : '#999999')
                                }
                            ]}>
                                Game Issue
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.reportTypeButton,
                                {
                                    backgroundColor: reportType === 'refund_agreement'
                                        ? '#00bf63'
                                        : (isLight ? '#f5f5f5' : '#1a1a1a'),
                                    borderColor: reportType === 'refund_agreement' ? '#00bf63' : (isLight ? '#cccccc' : '#333333'),

                                }
                            ]}
                            onPress={() => setReportType('refund_agreement')}
                        >
                            <Text style={[
                                styles.reportTypeButtonText,
                                {
                                    color: reportType === 'refund_agreement'
                                        ? '#ffffff'
                                        : (isLight ? '#666666' : '#999999')
                                }
                            ]}>
                                Refund Agreement
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Report Details Section */}
                <View style={styles.section}>
                    <SectionTitle
                        title="Report Details"
                        isLight={isLight}
                    />

                    <Text style={[
                        styles.subtitle,
                        { color: isLight ? '#666666' : '#cccccc' }
                    ]}>
                        {reportType === 'refund_agreement'
                            ? 'Both players le Refund Agreement garnu vyo vni Entry Point refund paunu huncha. \n(Notification & Guide will be delivered to your opponent)'
                            : 'Tapai ko match ma k-kasto problem aako chha hami lai explain garnus and screenshots pni dinu hos. Try to provide different screenshots for better and strong report claim. \n(False info may result in a -20 point fine.)'}
                    </Text>

                    {/* Description and Evidence Upload Section - Only for Game Issue */}
                    {reportType === 'game_issue' && (
                        <>
                            {/* Description Input */}
                            <View style={styles.descriptionSection}>
                                <View
                                    style={[
                                        styles.descriptionContainer,
                                        {
                                            backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
                                            borderColor: isLight ? "#cccccc" : "#333333",
                                        }
                                    ]}
                                >
                                    <TextInput
                                        style={[
                                            styles.descriptionInput,
                                            { color: isLight ? "#333333" : "#ffffff" }
                                        ]}
                                        placeholder="Describe your issue in detail..."
                                        placeholderTextColor={isLight ? "#666666" : "#999999"}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>

                            {/* Evidence Upload */}
                            <ImagePickerButton
                                evidence={evidence1}
                                onPress={() => pickImage(setEvidence1, setImageResult1)}
                                title="Tap to Upload Evidence 1"
                            />
                            <ImagePickerButton
                                evidence={evidence2}
                                onPress={() => pickImage(setEvidence2, setImageResult2)}
                                title="Tap to Upload Evidence 2"
                            />
                            <ImagePickerButton
                                evidence={evidence3}
                                onPress={() => pickImage(setEvidence3, setImageResult3)}
                                title="Tap to Upload Evidence 3"
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
    section: {
        marginBottom: 12,
    },
    gameInfoContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingVertical: 8,
        gap: 4,
    },
    gameInfoItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    value: {
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
        borderBottomWidth: 1,
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    reportTypeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    reportTypeButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    reportTypeButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    descriptionSection: {
        marginBottom: 16,
    },
    descriptionContainer: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 0,
        overflow: 'hidden',
        padding: 12,
        minHeight: 120,
    },
    descriptionInput: {
        flex: 1,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    imagePickerSection: {
        marginBottom: 16,
    },
    imagePickerButton: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 0,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedImageContainer: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    selectedImage: {
        width: 70,
        height: 70,
        borderRadius: 4,
    },
    imagePickerText: {
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 8,
    },
});

export default Report;
