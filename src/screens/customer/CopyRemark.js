import { StatusBar, StyleSheet, Text, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useMemo } from 'react'
import Toast from 'react-native-simple-toast'
import Clipboard from '@react-native-clipboard/clipboard'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import AppHeader from './header/AppHeader'
import { AppIcon } from '../../components/common/AppIcon'
import { Copy01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { fontSize, spacing, radius, iconSize } from '../../theme/typography'

const getPaymentRemark = (email = '') => {
  const prefix = email.split('@')[0]?.trim()
  return prefix || ''
}

const CopyRemark = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()

  const paymentRemark = useMemo(() => getPaymentRemark(user?.email), [user?.email])

  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    cardBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
    inputBackground: isLight ? '#f5f5f5' : '#1a1a1a',
    text: isLight ? '#000000' : '#ffffff',
    textSecondary: isLight ? 'rgba(51, 51, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    textTertiary: isLight ? '#666666' : '#999999',
    border: isLight ? '#eaeaea' : 'rgba(255, 255, 255, 0.3)',
  }

  const handleCopyAndProceed = () => {
    if (!paymentRemark) {
      Toast.show('Payment remark is not available.', Toast.SHORT)
      return
    }

    Clipboard.setString(paymentRemark)
    Toast.show('Payment remark copied.', Toast.SHORT)
    navigation.replace('pointsIn')
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <AppHeader backButton={true} title="Payment Remark" />

        <View style={styles.content}>
          <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.detailsHeader}>
              <AppIcon icon={InformationCircleIcon} size={iconSize.md} color={colors.text} />
              <Text style={[styles.detailsTitle, { color: colors.text }]}>
                Your Payment Remark
              </Text>
            </View>

            <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
              Copy and paste this remark on your payment to load points automatically.
            </Text>

            <View
              style={[
                styles.remarkDisplay,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.remarkLabel, { color: colors.textTertiary }]}>
                Remark
              </Text>
              <Text
                style={[styles.remarkValue, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="middle"
              >
                {paymentRemark || 'Remark unavailable'}
              </Text>
            </View>

            <Pressable
              onPress={handleCopyAndProceed}
              style={[
                styles.proceedButton,
                {
                  borderColor: isLight ? '#000000' : '#ffffff',
                  backgroundColor: isLight ? '#000000' : '#ffffff',
                  marginTop: spacing.xs,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Copy and proceed"
            >
              <AppIcon
                icon={Copy01Icon}
                size={iconSize.md}
                color={isLight ? '#ffffff' : '#000000'}
              />
              <Text style={[styles.proceedButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>
                Copy & Proceed
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate('tutorial')}
            style={styles.tutorialLink}
            accessibilityRole="link"
            accessibilityLabel="Watch tutorial"
          >
            <Text style={[styles.tutorialLinkText, { color: colors.text }]}>
              Watch Tutorial
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  )
}

export default CopyRemark

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  detailsCard: {
    width: '100%',
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
  remarkDisplay: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  remarkLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remarkValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
    width: '100%',
  },
  tutorialLink: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tutorialLinkText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  proceedButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
