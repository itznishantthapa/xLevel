import { StyleSheet, Text, View, Pressable, Image, Platform, ActivityIndicator, Modal, TouchableOpacity, StatusBar } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-simple-toast';
import { ResultAPI } from '../../api/resultApi';
import { CreateGameLayout } from '../../component/customer/createGame';
import { SectionTitle } from '../../component/customer/createGame';
import { scaleWidth } from '../../utils/scaling';
import { useResult } from '../../queries/useResult';

const ResultUpload = ({ route }) => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  // Screenshot states
  const [screenshot1, setScreenshot1] = useState(null);
  const [imageResult1, setImageResult1] = useState(null);
  const [screenshot2, setScreenshot2] = useState(null);
  const [imageResult2, setImageResult2] = useState(null);

  // Game result state
  const [gameResult, setGameResult] = useState('');

  // Keep original screenshot URIs so we can detect changes for resubmission
  const originalScreenshot1Ref = useRef(null);
  const originalScreenshot2Ref = useRef(null);

  // Error states
  const [errors, setErrors] = useState({
    screenshot1: '',
    screenshot2: '',
    gameResult: ''
  });

  // Get game data from route params
  const game = route.params?.game;

  //get result data if already submitted
  const { data: resultData } = useResult(game.id);


  //  LOG  resultData--->  {"created_at": "2025-09-05T15:05:05.604152Z", "id": 9, "reviewed_at": null, "screenshot_1": "http://192.168.1.84:8000/media/result_screenshots/screenshot1_Jd0MFZA.jpg", "screenshot_2": "http://192.168.1.84:8000/media/result_screenshots/screenshot2_I5im0In.jpg", "status": "pending", "submission_count": 1}

  // Effect to populate screenshot fields when resultData is available
  useEffect(() => {
    if (resultData) {
      // Set screenshot 1 if available
      if (resultData.screenshot_1) {
        setScreenshot1(resultData.screenshot_1);
        // Create a mock image result object for the existing screenshot
        setImageResult1({
          uri: resultData.screenshot_1,
          mimeType: 'image/jpeg'
        });
        // store original
        originalScreenshot1Ref.current = resultData.screenshot_1;
      }

      // Set screenshot 2 if available
      if (resultData.screenshot_2) {
        setScreenshot2(resultData.screenshot_2);
        // Create a mock image result object for the existing screenshot
        setImageResult2({
          uri: resultData.screenshot_2,
          mimeType: 'image/jpeg'
        });
        // store original
        originalScreenshot2Ref.current = resultData.screenshot_2;
      }

      // Set game result if available
      if (resultData.game_result) {
        setGameResult(resultData.game_result);
      }
    }
  }, [resultData]);

  // Derived flags
  const hasExistingResult = !!resultData;
  const isSubmitDisabled = resultData?.submission_count >= 3;

  const hasChanges = () => {
    // compare current screenshot URIs with the originals
    const orig1 = originalScreenshot1Ref.current || null;
    const orig2 = originalScreenshot2Ref.current || null;

    // If original was null and now there's a value -> changed
    if (orig1 !== screenshot1) return true;
    if (orig2 !== screenshot2) return true;
    return false;
  };

  // Image picker function
  const pickImage = async (setScreenshot, setImageResult, errorKey) => {
    try {

      if (isSubmitDisabled) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 1,
      });

      if (!result.canceled) {
        setImageResult(result.assets[0]);
        setScreenshot(result.assets[0].uri);

        // Clear error if exists
        if (errors[errorKey]) {
          setErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
      }
    } catch (error) {
      Toast.show("Unable to pick image", Toast.SHORT);
    }
  };

  const validateFields = () => {
    const newErrors = {
      screenshot1: '',
      screenshot2: '',
      gameResult: ''
    };

    if (!screenshot1) {
      newErrors.screenshot1 = 'Please upload first screenshot';
    }

    if (!screenshot2) {
      newErrors.screenshot2 = 'Please upload second screenshot';
    }

    if (!gameResult) {
      newErrors.gameResult = 'Please select your game result';
    }

    setErrors(newErrors);
    return !newErrors.screenshot1 && !newErrors.screenshot2 && !newErrors.gameResult;
  };

  const handleSubmit = async () => {
    // If there's an existing result and submit should be resubmit
    if (hasExistingResult) {

      if (isSubmitDisabled) {
        return;
      }

      // prevent resubmit unless screenshots changed
      if (!hasChanges()) {
        Toast.show('Please change the screenshot first', Toast.SHORT);
        return;
      }
    }

    if (!validateFields()) {
      return;
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
      formData.append('game_result', gameResult);

      // Append first screenshot - only if it's a new file (not from backend)
      if (imageResult1 && !imageResult1.uri.startsWith('http')) {
        formData.append('screenshot_1', {
          uri: screenshot1,
          name: 'screenshot1.jpg',
          type: imageResult1.mimeType || 'image/jpeg'
        });
      }

      // Append second screenshot - only if it's a new file (not from backend)
      if (imageResult2 && !imageResult2.uri.startsWith('http')) {
        formData.append('screenshot_2', {
          uri: screenshot2,
          name: 'screenshot2.jpg',
          type: imageResult2.mimeType || 'image/jpeg'
        });
      }

      // Submit result to API
      const response = await ResultAPI.submitResult(formData);
      Toast.show(response.message || 'Results submitted for review!', Toast.SHORT);
      navigation.goBack();
    } catch (error) {
      Toast.show(error?.message || 'Failed to submit results', Toast.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  // Game info display component
  const GameInfoHeader = ({ status }) => (
    <View style={[styles.section]}>
      <View style={[styles.gameInfoContainer]}>
        <MaterialIcons name="reviews" size={scaleWidth(20)} color={isLight ? "#333333" : "#ffffff"} />
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
                borderBottomWidth: 0,
              }
            ]}
          >
           ({status || "Not Submitted"})
          </Text>
        </View>

      </View>

    </View>
  );

  // Update ImagePickerButton
  const ImagePickerButton = ({
    screenshot,
    onPress,
    title,
    errorMessage
  }) => (
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
            setPreviewImage(screenshot); //open modal preview only
          } else {
            onPress(); // no screenshot → open picker directly
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
            {/* Only this text opens the picker */}
            <Pressable onPress={onPress}>
              <Text style={[
                styles.imagePickerText,
                { color: isLight ? "#666666" : "#cccccc" }
              ]}>
                {isSubmitDisabled ? 'Submitted' : 'Change Screenshot'}
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

  // Game Result Selector Component
  const GameResultSelector = ({ selectedResult, onSelect, errorMessage }) => {
    // Define all possible results
    const allGameResults = [
      { value: 'win', label: 'Won', icon: 'emoji-events', color: '#4CAF50' },
      { value: 'lose', label: 'Lost', icon: 'thumb-down', color: '#F44336' },
      { value: 'draw', label: 'Draw', icon: 'remove', color: '#FF9800' }
    ];

    // Check if current game supports draw (Chess and eFootball only)
    const gameName = game?.game?.name?.toLowerCase() || '';
    const supportsDraws = gameName.includes('chess') || gameName.includes('efootball');

    // Filter results based on game type
    const gameResults = supportsDraws
      ? allGameResults
      : allGameResults.filter(result => result.value !== 'draw');

    return (
      <View style={styles.gameResultSection}>

        <View style={styles.gameResultOptions}>
          {gameResults.map((result) => (
            <Pressable
              key={result.value}
              style={[
                styles.gameResultOption,
                {
                  backgroundColor: selectedResult === result.value
                    ? (isLight ? result.color : result.color)
                    : (isLight ? "#f5f5f5" : "#1a1a1a"),
                  borderColor: selectedResult === result.value
                    ? result.color
                    : (isLight ? "#cccccc" : "#333333"),
                }
              ]}
              onPress={() => {
                onSelect(result.value);
                if (errors.gameResult) {
                  setErrors(prev => ({ ...prev, gameResult: '' }));
                }
              }}
            >
              {/* <MaterialIcons
                name={result.icon}
                size={scaleWidth(24)}
                color={selectedResult === result.value 
                  ? "#ffffff" 
                  : (isLight ? "#666666" : "#cccccc")
                }
              /> */}
              <Text style={[
                styles.gameResultOptionText,
                {
                  color: selectedResult === result.value
                    ? "#ffffff"
                    : (isLight ? "#333333" : "#ffffff"),
                  fontWeight: selectedResult === result.value ? 'bold' : 'normal'
                }
              ]}>
                {result.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <>
      <CreateGameLayout
        title="Result"
        isLight={isLight}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        scrollViewRef={scrollViewRef}
        keyboardVisible={false}
        buttonTitle={hasExistingResult ? (isSubmitDisabled ? 'Submitted' : 'Resubmit') : 'Submit'}
        loaderMessage={hasExistingResult ? 'Resubmitting result...' : 'Submitting result...'}
      >
        {/* Game Info */}
        <GameInfoHeader
          status={resultData ? (resultData.status === 'pending' ? 'Pending Review' : resultData.status === 'approved' ? 'Approved' : 'Rejected') : 'Not Submitted'}
        />

        {/* Screenshots Section */}
        <View style={styles.section}>
          <SectionTitle
            title="Game Results"
            isLight={isLight}
          />

          <Text style={[
            styles.subtitle,
            { color: isLight ? '#666666' : '#cccccc', marginBottom: 16 }
          ]}>
            Please upload two screenshots of your game results exactly as shown in the example.
          </Text>

          {/* Important Rules */}
          <View style={[
            styles.rulesContainer,
            { 
              backgroundColor: isLight ? '#e8f9f0' : '#003d1f',
              borderColor: '#00bf63'
            }
          ]}>
            <View style={styles.rulesHeaderContainer}>
              <MaterialIcons 
                name="info-outline" 
                size={24} 
                color="#00bf63" 
              />
              <Text style={[
                styles.rulesHeading,
                { color: isLight ? '#003d1f' : '#ffffff' }
              ]}>
                Important Things to Know
              </Text>
            </View>
            
            <View style={styles.rulesTextContainer}>
              {[
                "If you lost the match, you don't need to submit the result.",
                "If you won the match, you must submit the result within 20 minutes.",
                "Submissions after 20 minutes may not be reviewed and can be marked as a loss.",
                "The 20 minute starts when both players finish the match, not when it begins."
              ].map((rule, index) => (
                <Text
                  key={index}
                  style={[
                    styles.rulesText,
                    { color: isLight ? '#003d1f' : '#ffffff', marginTop: index === 0 ? 0 : 10 },
                  ]}
                >
                  <Text style={styles.boldText}>{index + 1}.</Text> {rule}
                </Text>
              ))}
            </View>
          </View>

          {/* See Example Button */}
          <Pressable
            onPress={() => navigation.navigate('example', { 
              game: game?.game,
              guideType: 'result'
            })}
            style={[
              styles.seeExampleButton,
              { 
                backgroundColor: isLight ? '#f0fdf4' : '#022c22',
                borderColor: '#00bf63'
              }
            ]}
          >
            <View style={styles.exampleButtonContent}>
              <View style={styles.exampleIconContainer}>
                <MaterialIcons 
                  name="photo-library" 
                  size={20} 
                  color="#00bf63" 
                />
              </View>
              <Text style={[styles.seeExampleButtonText, { color: isLight ? '#003d1f' : '#00bf63' }]}>
                View Example Screenshots
              </Text>
            </View>
            <MaterialIcons 
              name="arrow-forward" 
              size={20} 
              color="#00bf63" 
            />
          </Pressable>

          {/* Game Result Selector */}
          <GameResultSelector
            selectedResult={gameResult}
            onSelect={setGameResult}
            errorMessage={errors.gameResult}
          />

          {/* Screenshot 1 */}
          <ImagePickerButton
            screenshot={screenshot1}
            onPress={() => pickImage(setScreenshot1, setImageResult1, 'screenshot1')}
            title="Upload Screenshot 1"
            errorMessage={errors.screenshot1}
          />

          {/* Screenshot 2 - Required for all games */}
          <ImagePickerButton
            screenshot={screenshot2}
            onPress={() => pickImage(setScreenshot2, setImageResult2, 'screenshot2')}
            title="Upload Screenshot 2"
            errorMessage={errors.screenshot2}
          />

          {/* Warning Message */}
          <View style={[
            styles.warningContainer,
            { 
              backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
              borderColor: isLight ? '#cccccc' : '#333333'
            }
          ]}>
            <Ionicons 
              name="warning-outline" 
              size={20} 
              color={isLight ? '#333333' : '#ffffff'} 
              style={styles.warningIcon}
            />
            <Text style={[
              styles.warningText,
              { color: isLight ? '#333333' : '#ffffff' }
            ]}>
            Submitting false results will lead to an account suspension and a 50 point penalty.
            </Text>
          </View>
        </View>
      </CreateGameLayout>

      <Modal
        visible={!!previewImage}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >

        <StatusBar
          translucent
          backgroundColor="rgba(0,0,0,0.9)" // same as modal bg
          barStyle="light-content"           // icons/text will be white
        />

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPressOut={() => setPreviewImage(null)} // 👈 only close modal
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
  },
  seeExampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  exampleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exampleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 191, 99, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeExampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rulesContainer: {
    flexDirection: 'column',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  rulesHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rulesHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  rulesTextContainer: {
    flex: 1,
  },
  rulesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
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
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4444',
    marginTop: 4,
  },
  gameResultSection: {
    marginBottom: 20,
  },
  gameResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  gameResultOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  gameResultOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  gameResultOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
});

export default ResultUpload;