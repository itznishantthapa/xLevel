import AsyncStorage from '@react-native-async-storage/async-storage';

//============ FCM Token Management ============
export const checkFCMTokenInStorage = async () => {
  try {
    const value = await AsyncStorage.getItem('@fcm_token');
    const hasToken = value !== null;
    return hasToken;
  } catch (error) {
    return false;
  }
};

export const storeFCMToken = async (token) => {
  try {
    await AsyncStorage.setItem('@fcm_token', token);
    return true;
  } catch (error) {
    return false;
  }
};

export const removeFCMToken = async () => {
  try {
    await AsyncStorage.removeItem('@fcm_token');
    return true;
  } catch (error) {
    return false;
  }
}; 