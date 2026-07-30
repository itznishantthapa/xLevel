import { useMemo, useRef, useState, useCallback } from 'react';
import Toast from 'react-native-simple-toast';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useStoreTopup } from '../queries/useMutation/useStoreTopup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

export const ACCOUNT_TYPES = [
  { id: 'efootball', label: 'eFootball' },
  { id: 'fc_mobile', label: 'FC Mobile' },
  { id: 'others', label: 'Others' },
];

const LOGIN_LABELS = {
  efootball: { email: 'Konami Email', password: 'Konami Password' },
  fc_mobile: { email: 'EA Email', password: 'EA Password' },
  others: { email: 'Account Email', password: 'Account Password' },
};

const buildValidationErrors = ({
  screenshot,
  dollarAmount,
  accountType,
  purchaseDescription,
  accountEmail,
  accountPassword,
  agreementAccepted,
}) => {
  const errors = {};
  const trimmedPrice = dollarAmount.trim();
  const trimmedEmail = accountEmail.trim();

  if (!screenshot) {
    errors.screenshot = 'Please upload an item screenshot';
  }

  if (!trimmedPrice) {
    errors.price = 'Please enter the item price';
  } else if (!PRICE_REGEX.test(trimmedPrice)) {
    errors.price = 'Enter a valid price (up to 2 decimal places)';
  } else if (parseFloat(trimmedPrice) <= 0) {
    errors.price = 'Item price must be greater than 0';
  }

  if (!accountType) {
    errors.accountType = 'Please select an account type';
  }

  if (accountType === 'others' && !purchaseDescription.trim()) {
    errors.purchaseDescription = 'Please tell us what you want to purchase';
  }

  if (!trimmedEmail) {
    errors.email = 'Please enter your account email';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!accountPassword.trim()) {
    errors.password = 'Please enter your account password';
  }

  if (!agreementAccepted) {
    errors.agreement = 'Please confirm your account info is correct';
  }

  return errors;
};

export const useEfootballStoreForm = (oneDollarPrice) => {
  const navigation = useNavigation();
  const { get_user } = useAuthStore();
  const { mutateAsync: storeTopup } = useStoreTopup();
  const termsRef = useRef(null);

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotResult, setScreenshotResult] = useState(null);
  const [dollarAmount, setDollarAmount] = useState('');
  const [accountType, setAccountType] = useState(null);
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const calculatedGamePoints = useMemo(() => {
    const amount = parseFloat(dollarAmount);
    if (Number.isNaN(amount) || amount <= 0) return 0;
    return Math.ceil(amount * oneDollarPrice);
  }, [dollarAmount, oneDollarPrice]);

  const loginLabels = useMemo(
    () => LOGIN_LABELS[accountType] ?? LOGIN_LABELS.others,
    [accountType],
  );

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.85,
      });

      if (!result.canceled) {
        setScreenshotResult(result.assets[0]);
        setScreenshot(result.assets[0].uri);
        clearFieldError('screenshot');
      }
    } catch {
      Toast.show('Unable to pick image', Toast.SHORT);
    }
  }, [clearFieldError]);

  const handleAccountTypeChange = useCallback(
    (typeId) => {
      setAccountType(typeId);
      clearFieldError('accountType');
      if (typeId !== 'others') {
        setPurchaseDescription('');
        clearFieldError('purchaseDescription');
      }
    },
    [clearFieldError],
  );

  const toggleAgreement = useCallback(() => {
    setAgreementAccepted((prev) => !prev);
    clearFieldError('agreement');
  }, [clearFieldError]);

  const handleConfirm = useCallback(async () => {
    const errors = buildValidationErrors({
      screenshot,
      dollarAmount,
      accountType,
      purchaseDescription,
      accountEmail,
      accountPassword,
      agreementAccepted,
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.agreement) {
        termsRef.current?.shake();
      }
      return;
    }

    const formData = new FormData();

    if (screenshotResult) {
      formData.append('screenshot', {
        uri: screenshot,
        name: 'efootball_screenshot.jpg',
        type: screenshotResult.mimeType || 'image/jpeg',
      });
    }

    formData.append('calculated_game_point', calculatedGamePoints.toString());
    formData.append('account_type', accountType);
    formData.append('email', accountEmail.trim());
    formData.append('password', accountPassword.trim());

    if (accountType === 'others') {
      formData.append('purchase_description', purchaseDescription.trim());
    }

    try {
      setIsSubmitting(true);
      await storeTopup(formData);
      await get_user();

      navigation.reset({
        index: 1,
        routes: [{ name: 'customerTabs' }, { name: 'gamePoints' }],
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to process request.';
      Toast.show(errorMessage, Toast.LONG);
      console.error('Topup Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    screenshot,
    dollarAmount,
    accountType,
    purchaseDescription,
    accountEmail,
    accountPassword,
    agreementAccepted,
    screenshotResult,
    calculatedGamePoints,
    storeTopup,
    get_user,
    navigation,
  ]);

  return {
    termsRef,
    screenshot,
    dollarAmount,
    setDollarAmount,
    accountType,
    purchaseDescription,
    setPurchaseDescription,
    accountEmail,
    setAccountEmail,
    accountPassword,
    setAccountPassword,
    agreementAccepted,
    isSubmitting,
    showPassword,
    setShowPassword,
    fieldErrors,
    calculatedGamePoints,
    loginLabels,
    pickImage,
    handleAccountTypeChange,
    toggleAgreement,
    handleConfirm,
    clearFieldError,
  };
};
