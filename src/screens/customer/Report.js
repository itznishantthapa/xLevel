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
    const ImagePickerButton = ({ evidence, onPress, title, isLight }) => (
        <View style={styles.imagePickerSection}>
            <Pressable
                style={[
                    styles.imagePickerButton,
                    {
                        backgroundColor: isLight ? "#ffffff" : "#0a0a0a",
                        borderColor: isLight ? "#000000" : "#ffffff",
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
                                { color: isLight ? "#000000" : "#ffffff" }
                            ]}>
                                CHANGE
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <MaterialIcons
                            name="add-photo-alternate"
                            size={32}
                            color={isLight ? "#000000" : "#ffffff"}
                        />
                        <Text style={[
                            styles.imagePickerText,
                            { color: isLight ? "#000000" : "#ffffff", marginTop: 8 }
                        ]}>
                            TAP TO UPLOAD
                        </Text>
                        <Text style={[
                            styles.imagePickerText,
                            { color: isLight ? "#000000" : "#ffffff", marginTop: 4, fontSize: 12, fontWeight: '600', opacity: 0.7, letterSpacing: 0.5 }
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
                        { color: isLight ? '#333333' : '#ffffff', fontWeight: '600', letterSpacing: 0.5 }
                    ]}>
                        SELECT REPORT TYPE
                    </Text>

                    {/* Report Type Buttons */}
                    <View style={styles.reportTypeContainer}>
                        <Pressable
                            style={[
                                styles.reportTypeButton,
                                {
                                    backgroundColor: reportType === 'game_issue'
                                        ? (isLight ? '#000000' : '#ffffff')
                                        : (isLight ? '#ffffff' : '#0a0a0a'),
                                    borderColor: reportType === 'game_issue' ? (isLight ? '#ffffff' : '#000000') : (isLight ? '#000000' : '#ffffff'),
                                }
                            ]}
                            onPress={() => setReportType('game_issue')}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={[
                                    styles.reportTypeButtonText,
                                    {
                                        color: reportType === 'game_issue'
                                            ? (isLight ? '#ffffff' : '#000000')
                                            : (isLight ? '#000000' : '#ffffff'),
                                        letterSpacing: 1.2,
                                    }
                                ]}>
                                    ISSUE
                                </Text>
                            </View>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.reportTypeButton,
                                {
                                    backgroundColor: reportType === 'refund_agreement'
                                        ? (isLight ? '#000000' : '#ffffff')
                                        : (isLight ? '#ffffff' : '#0a0a0a'),
                                    borderColor: reportType === 'refund_agreement' ? (isLight ? '#ffffff' : '#000000') : (isLight ? '#000000' : '#ffffff'),
                                }
                            ]}
                            onPress={() => setReportType('refund_agreement')}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={[
                                    styles.reportTypeButtonText,
                                    {
                                        color: reportType === 'refund_agreement'
                                            ? (isLight ? '#ffffff' : '#000000')
                                            : (isLight ? '#000000' : '#ffffff'),
                                        letterSpacing: 1.2,
                                    }
                                ]}>
                                    REFUND
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Report Details Section */}
                <View style={styles.detailsSection}>
                    <View style={[
                        styles.detailsContainer,
                        { borderColor: isLight ? '#000000' : '#ffffff' }
                    ]}>
                        {/* Header with accent line */}
                        <View style={styles.detailsHeader}>
                            <View style={[
                                styles.accentLine,
                                { backgroundColor: isLight ? '#000000' : '#ffffff' }
                            ]} />
                            <SectionTitle
                                title="REPORT DETAILS"
                                isLight={isLight}
                            />
                        </View>

                        {/* Details content */}
                        <View style={styles.detailsContent}>
                            <Text style={[
                                styles.detailsText,
                                { color: isLight ? '#333333' : '#ffffff' }
                            ]}>
                                {reportType === 'refund_agreement'
                                    ? 'Both players le Refund Agreement garnu vyo vni Entry Point refund paunu huncha.\n(Notification & Guide will be delivered to your opponent)'
                                    : 'Tapai ko match ma k-kasto problem aako chha hami lai explain garnus and screenshots pni dinu hos. All 3 screenshots required.\n(False info may result in -20 points)'}
                            </Text>
                        </View>

                        {/* Bottom accent line */}
                        <View style={[
                            styles.bottomAccentLine,
                            { backgroundColor: isLight ? '#000000' : '#ffffff' }
                        ]} />
                    </View>

                    {/* Description and Evidence Upload Section - Only for Game Issue */}
                    {reportType === 'game_issue' && (
                        <>
                            {/* Description Input */}
                            <View style={styles.descriptionSection}>
                                <View style={styles.inputLabel}>
                                    <View style={[styles.labelDot, { backgroundColor: isLight ? '#000000' : '#ffffff' }]} />
                                    <Text style={[styles.labelText, { color: isLight ? '#000000' : '#ffffff' }]}>
                                        DESCRIPTION
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.descriptionContainer,
                                        {
                                            backgroundColor: isLight ? '#ffffff' : '#0a0a0a',
                                            borderColor: isLight ? '#000000' : '#ffffff',
                                        }
                                    ]}
                                >
                                    <TextInput
                                        style={[
                                            styles.descriptionInput,
                                            { color: isLight ? "#000000" : "#ffffff" }
                                        ]}
                                        placeholder="Describe the issue in detail..."
                                        placeholderTextColor={isLight ? "#999999" : "#666666"}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>

                            {/* Evidence Upload */}
                            <View style={styles.evidenceSection}>
                                <View style={styles.inputLabel}>
                                    <View style={[styles.labelDot, { backgroundColor: isLight ? '#000000' : '#ffffff' }]} />
                                    <Text style={[styles.labelText, { color: isLight ? '#000000' : '#ffffff' }]}>
                                        EVIDENCE
                                    </Text>
                                </View>
                                <ImagePickerButton
                                    evidence={evidence1}
                                    onPress={() => pickImage(setEvidence1, setImageResult1)}
                                    title="Screenshot 1"
                                    isLight={isLight}
                                />
                                <ImagePickerButton
                                    evidence={evidence2}
                                    onPress={() => pickImage(setEvidence2, setImageResult2)}
                                    title="Screenshot 2"
                                    isLight={isLight}
                                />
                                <ImagePickerButton
                                    evidence={evidence3}
                                    onPress={() => pickImage(setEvidence3, setImageResult3)}
                                    title="Screenshot 3"
                                    isLight={isLight}
                                />
                            </View>
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
        fontSize: 12,
        marginBottom: 16,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 1,
    },
    reportTypeContainer: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 24,
    },
    reportTypeButton: {
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
    },
    buttonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportTypeButtonText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    
    // Details Section Styles
    detailsSection: {
        marginBottom: 20,
    },
    detailsContainer: {
        borderWidth: 2,
        borderRadius: 1,
        overflow: 'hidden',
        marginBottom: 20,
    },
    detailsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    accentLine: {
        width: 4,
        height: 24,
    },
    detailsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 60,
        justifyContent: 'center',
    },
    detailsText: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    bottomAccentLine: {
        height: 2,
        width: '100%',
    },
    
    // Input Section Styles
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingVertical: 8,
    },
    labelDot: {
        width: 6,
        height: 6,
        borderRadius: 1,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    
    descriptionSection: {
        marginBottom: 20,
    },
    descriptionContainer: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 1,
        overflow: 'hidden',
        padding: 14,
        minHeight: 120,
    },
    descriptionInput: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        textAlignVertical: 'top',
        fontWeight: '500',
    },
    
    evidenceSection: {
        marginBottom: 16,
    },
    imagePickerSection: {
        marginBottom: 14,
    },
    imagePickerButton: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
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
        borderRadius: 2,
    },
    imagePickerText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.8,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

export default Report;
