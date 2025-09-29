import { StyleSheet, Text, View, Pressable, Image, Platform, ActivityIndicator, Modal, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import React, { useState, useRef } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-simple-toast';
import { CreateGameLayout } from '../../../component/customer/createGame';
import { SectionTitle } from '../../../component/customer/createGame';
import { scaleWidth } from '../../../utils/scaling';
import { IssueAPI } from '../../../api/issueApi';
import { useCreateIssue } from '../../../queries/useMutation/useCreateIssue';

const DropIssue = ({ route }) => {
    const navigation = useNavigation();
    const { isLight } = useThemeStore();
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const { mutateAsync: createIssue } = useCreateIssue();

    // Get data from route params, here game is the challenge_id only 
    const { challenge_id, issueType, game_name, game_mode } = route.params;

    // Issue states
    const [description, setDescription] = useState('');
    const [mistakeSettingImage, setMistakeSettingImage] = useState(null);
    const [imageResult, setImageResult] = useState(null);

    // Error states
    const [errors, setErrors] = useState({
        description: '',
        image: ''
    });

    // Helper function to get issue type display name
    const getIssueTypeDisplayName = () => {
        switch (issueType) {
            case 'mistake_setting':
                return 'Game Settings Issue';
            case 'mistake_credentials':
                return 'Wrong Credentials';
            case 'opponent_not_joined':
                return "Opponent Didn't Join";
            case 'creator_not_provided':
                return "Creator Didn't Provide";
            case 'offline':
                return 'Offline/Connection Lost';
            default:
                return 'Issue Report';
        }
    };

    // Helper function to get placeholder text for description
    const getDescriptionPlaceholder = () => {
        switch (issueType) {
            case 'mistake_setting':
                return 'Describe what game settings were mentioned by creator vs actual game settings...';
            case 'mistake_credentials':
                return 'Explain why you provided wrong credentials and confirm mutual agreement...';
            case 'opponent_not_joined':
                return 'Describe when credentials were provided and how opponent failed to join...';
            case 'creator_not_provided':
                return 'Mention how long you waited and that creator never provided credentials...';
            case 'offline':
                return 'Describe when and how the opponent went offline or lost connection...';
            default:
                return 'Describe your issue in detail...';
        }
    };

    // Image picker function (only for mistake_setting)
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                quality: 1,
            });

            if (!result.canceled) {
                setImageResult(result.assets[0]);
                setMistakeSettingImage(result.assets[0].uri);

                // Clear error if exists
                if (errors.image) {
                    setErrors(prev => ({ ...prev, image: '' }));
                }
            }
        } catch (error) {
            Toast.show("Unable to pick image", Toast.SHORT);
        }
    };

    const validateFields = () => {
        const newErrors = {
            description: '',
            image: ''
        };

        if (!description.trim()) {
            newErrors.description = 'Please provide a description of the issue';
        }

        if (issueType === 'mistake_setting' && !mistakeSettingImage) {
            newErrors.image = 'Please upload a screenshot for game settings issue';
        }

        setErrors(newErrors);
        return !newErrors.description && !newErrors.image;
    };

    const handleSubmit = async () => {
        if (!validateFields()) {
            return;
        }

        if (!challenge_id) {
            Toast.show('Invalid challenge data', Toast.SHORT);
            return;
        }

        setIsLoading(true);

        try {
            // Prepare form data for API call
            const formData = new FormData();
            formData.append('challenge_id', challenge_id);
            formData.append('issue_type', issueType);
            formData.append('description', description.trim());

            // Append image only for mistake_setting
            if (issueType === 'mistake_setting' && imageResult) {
                formData.append('mistake_setting_img', {
                    uri: mistakeSettingImage,
                    name: 'mistake_setting.jpg',
                    type: imageResult.mimeType || 'image/jpeg'
                });
            }

            await createIssue(formData);

            navigation.reset({
                index: 1,
                routes: [ 
                    { name: 'customerTabs', params: { screen: 'MatchTab' } },
                    { name: 'issue' }
                ],
            });
        } catch (error) {
            Toast.show(error?.message || 'Failed to report issue', Toast.SHORT);
        } finally {
            setIsLoading(false);
        }
    };

    // Game info display component
    const GameInfoHeader = () => (
        <View style={[styles.section]}>
            <View style={[styles.gameInfoContainer]}>
                <MaterialIcons name="report-problem" size={scaleWidth(20)} color={isLight ? "#333333" : "#ffffff"} />
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
                        {game_name || "Game"}
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
                        {game_mode || "Mode"}
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
                        {getIssueTypeDisplayName()}
                    </Text>
                </View>
            </View>
        </View>
    );

    // Image picker button (only for mistake_setting)
    const ImagePickerButton = ({ screenshot, onPress, title, errorMessage }) => (
        <View style={styles.imagePickerSection}>
            <Pressable
                style={[
                    styles.imagePickerButton,
                    {
                        backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
                        borderColor: isLight ? "#cccccc" : "#333333",
                        height: screenshot ? 100 : 150,
                    }
                ]}
                onPress={() => {
                    if (screenshot) {
                        setPreviewImage(screenshot);
                    } else {
                        onPress();
                    }
                }}
            >
                {screenshot ? (
                    <View style={styles.selectedImageContainer}>
                        <Image
                            source={{ uri: screenshot }}
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
            {errorMessage ? (
                <Text style={styles.errorText}>
                    {errorMessage}
                </Text>
            ) : null}
        </View>
    );

    return (
        <>
            <CreateGameLayout
                title="Report Issue"
                isLight={isLight}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                buttonTitle="Submit Issue"
                loaderMessage="Reporting issue..."
            >
                {/* Game Info */}
                <GameInfoHeader />

                {/* Issue Details Section */}
                <View style={styles.section}>
                    <SectionTitle
                        title="Issue Details"
                        isLight={isLight}
                    />

                    <Text style={[
                        styles.subtitle,
                        { color: isLight ? '#666666' : '#cccccc' }
                    ]}>
                        {issueType === 'mistake_setting'
                            ? 'Please upload a screenshot and describe the issue with game settings (Note: 30 points fine & 3-day ban for wrong info).'
                            : 'Please describe the issue in detail.'
                        }
                    </Text>

                    {/* Image upload for mistake_setting only */}
                    {issueType === 'mistake_setting' && (
                        <ImagePickerButton
                            screenshot={mistakeSettingImage}
                            onPress={pickImage}
                            title="Upload Screenshot of Game Settings"
                            errorMessage={errors.image}
                        />
                    )}

                    {/* Description input - moved directly here instead of using function component */}
                    <View style={styles.descriptionSection}>
                        <View
                            style={[
                                styles.descriptionContainer,
                                {
                                    backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a",
                                    borderColor: isLight ? "#cccccc" : "#333333",
                                    height: 150,
                                }
                            ]}
                        >
                            <TextInput
                                style={[
                                    styles.descriptionInput,
                                    { color: isLight ? "#333333" : "#ffffff" }
                                ]}
                                placeholder={getDescriptionPlaceholder()}
                                placeholderTextColor={isLight ? "#666666" : "#999999"}
                                value={description}
                                onChangeText={(text) => {
                                    setDescription(text);
                                    if (errors.description) {
                                        setErrors(prev => ({ ...prev, description: '' }));
                                    }
                                }}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                        {errors.description ? (
                            <Text style={styles.errorText}>
                                {errors.description}
                            </Text>
                        ) : null}
                    </View>
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
    descriptionSection: {
        marginBottom: 16,
    },
    descriptionContainer: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 0,
        overflow: 'hidden',
        padding: 12,
    },
    descriptionInput: {
        flex: 1,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FF4444',
        marginTop: 4,
    },
});

export default DropIssue;