import React from 'react'
import { StyleSheet, Text, View, StatusBar, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../../../components/common/AppIcon'
import { ArrowLeft01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons'
import { iconSize } from '../../../theme/typography'
import { useNavigation } from '@react-navigation/native'
import { useThemeStore } from '../../../store/themeStore'

const Thanks = () => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AppIcon icon={ArrowLeft01Icon} size={iconSize.lg} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.cardBackground }]}>
            <AppIcon icon={AlertCircleIcon} size={iconSize.xl} color={colors.text} />
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Thank You!
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your report has been submitted successfully
          </Text>

          <View style={[styles.descriptionContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Our moderation team will review this report and take appropriate action within 24-48 hours.
            </Text>
          </View>
        </View>

        <View style={styles.backInstructionContainer}>
          <Text style={[styles.backInstructionText, { color: colors.textSecondary }]}>
            You have blocked the user. Refresh to update.
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Thanks

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionContainer: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 280,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  backInstructionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backInstructionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
})
