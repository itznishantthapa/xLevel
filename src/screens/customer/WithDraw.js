import { StatusBar, StyleSheet, Text, View, Image, ScrollView, TextInput, Platform, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-simple-toast';
import * as ImagePicker from 'expo-image-picker';
import { TranscationAPI } from '../../api/transcationApi';
import { useQueryClient } from '@tanstack/react-query';
import AppHeader from './header/AppHeader';
import { useWithdraw } from '../../queries/useMutation/useWithdraw';
import CoolButton from '../../component/customer/common/CoolButton';

const WithDraw = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLight } = useThemeStore();
  const { mutateAsync: withdrawCrown } = useWithdraw();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#666666" : "#999999",
    border: isLight ? "#000000" : "#ffffff",
    inputBg: isLight ? "#ffffff" : "#1a1a1a",
    qrBg: isLight ? "#f8f9fa" : "#1a1a1a",
  };

  const [crownAmount, setCrownAmount] = useState('');
  const [imageResult, setImageResult] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [disableBtn, setdisableBtn] = useState(false);
  const [errors, setErrors] = useState({
    amount: '',
    qr: ''
  });

  // QR Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 1,
      });

      if (!result.canceled) {
        setImageResult(result.assets[0]);
        setQrImage(result.assets[0].uri);
        setErrors(prev => ({ ...prev, qr: '' })); // Clear QR error when image is selected
      }
    } catch (error) {
      Toast.show('Unable to pick QR image', Toast.SHORT);
    }
  };

  const validateFields = () => {
    const newErrors = {
      amount: '',
      qr: ''
    };

    if (!crownAmount) {
      newErrors.amount = 'Please enter points amount';
    } else if (parseInt(crownAmount) < 100) {
      newErrors.amount = 'Minimum withdrawal is 100 points';
    }

    if (!qrImage) {
      newErrors.qr = 'Please upload your payment QR code';
    }

    setErrors(newErrors);
    return !newErrors.amount && !newErrors.qr;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    setdisableBtn(true)

    const formData = new FormData();
    formData.append('crown_amount', crownAmount);
    if (imageResult) {
      formData.append('qr_image', {
        uri: qrImage,
        name: 'qr_code.jpg',
        type: imageResult.mimeType || 'image/jpeg'
      });
    }

    try {
      await withdrawCrown(formData);
      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'transaction' }
        ],
      });
    } catch (err) {
      Toast.show(err?.message || 'Failed to submit withdrawal request.', Toast.SHORT)
    } finally {
      setTimeout(() => {
        setdisableBtn(false)
      }, 2000)
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <View style={[styles.container, {
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }]}>

        <AppHeader
          backButton={true}
          title={'Withdraw Points'}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Pocket Design with Instructions */}
          <View style={styles.pocketWrapper}>
            <View style={[styles.pocketContainer, {
              backgroundColor: isLight ? '#FF9500' : '#1a1a1a',
              borderColor: '#FF9500'
            }]}>
              {/* Pocket Content - Instructions */}
              <View style={styles.pocketContent}>
                <View style={styles.instructionHeader}>
                  <MaterialCommunityIcons name="information" size={20} color={isLight ? "#ffffff" : "#FF9500"} />
                  <Text style={[styles.instructionTitle, { color: isLight ? "#ffffff" : "#FF9500" }]}>
                    Withdrawal Instructions
                  </Text>
                </View>

                <View style={styles.instructionsContainer}>
                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(255,149,0,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#FF9500" }]}>1</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Minimum withdrawal amount is 100 points (100 Points = Rs. 100).
                    </Text>
                  </View>

                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(255,149,0,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#FF9500" }]}>2</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Upload your payment QR code (Esewa, Khalti, etc.) below.
                    </Text>
                  </View>

                  <View style={styles.instructionRow}>
                    <View style={[styles.stepBadge, { backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "rgba(255,149,0,0.2)" }]}>
                      <Text style={[styles.stepNumber, { color: isLight ? "#ffffff" : "#FF9500" }]}>3</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: isLight ? "#ffffff" : colors.text }]}>
                      Enter withdrawal amount and submit for processing.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* QR Upload overlapping the pocket bottom */}
            <View style={styles.qrOverlapContainer}>
              <Pressable
                style={[styles.qrContainer, {
                  backgroundColor: colors.qrBg,
                  borderColor: qrImage ? colors.border : '#FF9500',
                }]}
                onPress={pickImage}
              >
                {qrImage ? (
                  <Image
                    source={{ uri: qrImage }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={80} color="#FF9500" />
                    <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                      Tap to upload your QR
                    </Text>
                  </View>
                )}
              </Pressable>
              {qrImage && (
                <Pressable
                  style={styles.changeQRButton}
                  onPress={pickImage}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.changeQRText}>Change QR</Text>
                </Pressable>
              )}
            </View>
          </View>

          {errors.qr ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#FF4444" />
              <Text style={styles.errorText}>{errors.qr}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Points Amount Input */}
            <View style={styles.inputContainer}>
              <View style={styles.labelCrownContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Withdrawal Amount</Text>
              </View>
              <View style={[styles.inputWrapper, {
                borderColor: errors.amount ? '#FF4444' : colors.border,
                backgroundColor: colors.inputBg,
              }]}>
                <MaterialCommunityIcons
                  name="star-four-points-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter amount (e.g., 100)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={crownAmount}
                  onChangeText={(text) => {
                    setCrownAmount(text);
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: '' }));
                    }
                  }}
                />
              </View>
              {errors.amount ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#FF4444" />
                  <Text style={styles.errorText}>{errors.amount}</Text>
                </View>
              ) : null}
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <CoolButton handlePress={handleSubmit} disableBtn={disableBtn} title={'Submit Withdrawal'} />
        </View>

      </View>
    </>
  )
}

export default WithDraw

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  pocketWrapper: {
    width: "100%",
    position: 'relative',
  },
  pocketContainer: {
    width: "100%",
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    borderWidth: 2,
    paddingTop: 20,
    paddingBottom: 80,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  pocketContent: {
    width: "100%",
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    gap: 12,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingTop: 4,
  },
  qrOverlapContainer: {
    position: 'absolute',
    bottom: -220,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  qrContainer: {
    width: '90%',
    height: 340,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  qrImage: {
    height: "100%",
    width: "100%",
    borderRadius: 12,
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeQRButton: {
    position: 'absolute',
    bottom: 10,
    right: '8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FF9500',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeQRText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 20,
    marginTop: 230,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelCrownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4444',
  }
});