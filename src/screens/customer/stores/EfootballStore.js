import { View, Text, StyleSheet, Image, Pressable, TextInput } from 'react-native';
import { useMemo } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { PointsIcon } from '../../../components/common/AppIcon';
import { fontSize, iconSize, spacing, radius } from '../../../theme/typography';
import { useStoreScreenData } from '../../../hooks/useStoreScreenData';
import { useEfootballStoreForm, ACCOUNT_TYPES } from '../../../hooks/useEfootballStoreForm';
import {
  CreateGameLayout,
  DividerLine,
  TermsAgreement,
  OptionButton,
} from '../../../component/customer/createGame';

const getFormColors = (isLight) => ({
  cardBackground: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
  inputBackground: isLight ? '#f5f5f5' : '#1a1a1a',
  surface: isLight ? '#ffffff' : '#0a0a0a',
  text: isLight ? '#000000' : '#ffffff',
  textSecondary: isLight ? 'rgba(51, 51, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  textMuted: isLight ? '#666666' : '#999999',
  border: isLight ? '#e5e5e5' : 'rgba(255, 255, 255, 0.25)',
  error: '#ef4444',
  accent: '#00bf63',
  accentSoft: isLight ? '#f0fdf4' : 'rgba(0, 191, 99, 0.12)',
});

const FormSection = ({ title, subtitle, colors, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {subtitle ? (
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    ) : null}
    {children}
  </View>
);

const FieldError = ({ message, colors, align = 'center' }) =>
  message ? (
    <Text
      style={[
        styles.fieldErrorText,
        align === 'left' && styles.leftAlignedError,
        { color: colors.error },
      ]}
    >
      {message}
    </Text>
  ) : null;

const LabeledInput = ({
  label,
  value,
  onChangeText,
  colors,
  error,
  secureTextEntry,
  keyboardType = 'default',
  onToggleSecure,
  showPassword,
}) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>
    <View
      style={[
        styles.inputShell,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.error : colors.border,
        },
      ]}
    >
      <TextInput
        style={[styles.textInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
      />
      {onToggleSecure ? (
        <Pressable onPress={onToggleSecure} hitSlop={8}>
          <Text style={[styles.toggleSecureText, { color: colors.textMuted }]}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      ) : null}
    </View>
    <FieldError message={error} colors={colors} align="left" />
  </View>
);

const ScreenshotSection = ({ screenshot, onPick, error, colors }) =>
  screenshot ? (
    <View style={styles.selectedImageWrapper}>
      <View
        style={[
          styles.imagePreviewCard,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
        ]}
      >
        <Image source={{ uri: screenshot }} style={styles.previewImage} resizeMode="contain" />
      </View>
      <Pressable
        style={[
          styles.changeButton,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
        ]}
        onPress={onPick}
      >
        <Text style={[styles.changeButtonText, { color: colors.textSecondary }]}>
          Change screenshot
        </Text>
      </Pressable>
    </View>
  ) : (
    <Pressable
      style={[
        styles.imagePickerButton,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.error : colors.border,
        },
      ]}
      onPress={onPick}
    >
      <Text style={[styles.uploadText, { color: colors.text }]}>Upload screenshot</Text>
      <Text style={[styles.uploadHint, { color: colors.textMuted }]}>
        PNG or JPG · item details visible
      </Text>
    </Pressable>
  );

const PriceSection = ({
  dollarAmount,
  onChangeAmount,
  calculatedGamePoints,
  error,
  colors,
}) => (
  <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
    <View style={styles.priceRow}>
      <View style={styles.priceField}>
        <View
          style={[
            styles.priceInputShell,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
        >
          <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>$</Text>
          <TextInput
            style={[styles.priceInput, { color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            value={dollarAmount}
            onChangeText={onChangeAmount}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.currencyLabel, { color: colors.textMuted }]}>USD</Text>
        </View>
        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Price</Text>
        <FieldError message={error} colors={colors} />
      </View>

      <Text style={[styles.arrowText, { color: colors.textMuted }]}>→</Text>

      <View style={styles.priceField}>
        <View
          style={[
            styles.pointsDisplay,
            { borderColor: colors.accent, backgroundColor: colors.accentSoft },
          ]}
        >
          <PointsIcon size={iconSize.md} color={colors.accent} />
          <Text style={[styles.pointsValue, { color: colors.accent }]}>
            {calculatedGamePoints}
          </Text>
        </View>
        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Game points</Text>
      </View>
    </View>
  </View>
);

const EfootballStore = () => {
  const { isLight } = useThemeStore();
  const { storeItemsData, isOpening: isLoadingStore } = useStoreScreenData('efootball');

  const oneDollarPrice =
    storeItemsData?.find((item) => item.label === 'OneDollarPrice')?.points || 148;

  const colors = useMemo(() => getFormColors(isLight), [isLight]);

  const {
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
  } = useEfootballStoreForm(oneDollarPrice);

  return (
    <CreateGameLayout
      storeKey="efootball"
      lightHeader
      title="Efootball, FC & More"
      isLight={isLight}
      isLoading={isLoadingStore || isSubmitting}
      isFormValid
      onSubmit={handleConfirm}
      buttonTitle={isSubmitting ? 'Purchasing...' : 'Confirm Purchase'}
      loaderMessage={isSubmitting ? 'Processing...' : 'Opening Store...'}
    >
      <View style={styles.container}>
        <FormSection
          title="Item screenshot"
          subtitle="Upload a clear screenshot of the item you want to purchase"
          colors={colors}
        >
          <ScreenshotSection
            screenshot={screenshot}
            onPick={pickImage}
            error={fieldErrors.screenshot}
            colors={colors}
          />
          <FieldError message={fieldErrors.screenshot} colors={colors} />
        </FormSection>

        <DividerLine isLight={isLight} />

        <FormSection
          title="Item price"
          subtitle="Enter the price in USD to see your total game points"
          colors={colors}
        >
          <PriceSection
            dollarAmount={dollarAmount}
            onChangeAmount={(text) => {
              setDollarAmount(text);
              clearFieldError('price');
            }}
            calculatedGamePoints={calculatedGamePoints}
            error={fieldErrors.price}
            colors={colors}
          />
        </FormSection>

        <DividerLine isLight={isLight} />

        <FormSection
          title="Account type"
          subtitle="Choose the account type for this purchase"
          colors={colors}
        >
          <View style={styles.accountTypeRow}>
            {ACCOUNT_TYPES.map((type) => (
              <OptionButton
                key={type.id}
                label={type.label}
                isSelected={accountType === type.id}
                onPress={() => handleAccountTypeChange(type.id)}
                isLight={isLight}
              />
            ))}
          </View>
          <FieldError message={fieldErrors.accountType} colors={colors} align="left" />

          {accountType === 'others' ? (
            <View
              style={[
                styles.textAreaShell,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: fieldErrors.purchaseDescription ? colors.error : colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="What would you like to purchase?"
                placeholderTextColor={colors.textMuted}
                value={purchaseDescription}
                onChangeText={(text) => {
                  setPurchaseDescription(text);
                  clearFieldError('purchaseDescription');
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          ) : null}
          <FieldError message={fieldErrors.purchaseDescription} colors={colors} align="left" />
        </FormSection>

        <DividerLine isLight={isLight} />

        <FormSection
          title="Account login"
          subtitle="Provide the login details for your account"
          colors={colors}
        >
          <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
            <LabeledInput
              label={loginLabels.email}
              value={accountEmail}
              onChangeText={(text) => {
                setAccountEmail(text);
                clearFieldError('email');
              }}
              keyboardType="email-address"
              error={fieldErrors.email}
              colors={colors}
            />

            <LabeledInput
              label={loginLabels.password}
              value={accountPassword}
              onChangeText={(text) => {
                setAccountPassword(text);
                clearFieldError('password');
              }}
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              onToggleSecure={() => setShowPassword((prev) => !prev)}
              error={fieldErrors.password}
              colors={colors}
            />

            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              If 2FA is enabled, we will ask for the OTP code via notification.
            </Text>
          </View>
        </FormSection>
      </View>

      <TermsAgreement
        ref={termsRef}
        isAccepted={agreementAccepted}
        onToggle={toggleAgreement}
        isLight={isLight}
        text="I confirm my account info is correct. (Do not submit false requests, submission may fine you 20 points)"
      />
    </CreateGameLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  imagePickerButton: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xxs,
  },
  selectedImageWrapper: {
    gap: spacing.sm,
  },
  imagePreviewCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.sm,
  },
  changeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  changeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
    gap: spacing.xs,
  },
  priceInputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
  },
  currencyPrefix: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    padding: 0,
  },
  currencyLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  leftAlignedError: {
    textAlign: 'left',
  },
  arrowText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    paddingTop: spacing.md,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    minHeight: 48,
  },
  pointsValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textAreaShell: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 100,
  },
  textArea: {
    fontSize: fontSize.md,
    lineHeight: 20,
    minHeight: 80,
    padding: 0,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
  },
  toggleSecureText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    paddingLeft: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});

export default EfootballStore;
