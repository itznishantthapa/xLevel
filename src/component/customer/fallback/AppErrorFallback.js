import { View, Text, StyleSheet, StatusBar, Pressable } from "react-native"
import { __DEV__ } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { useMemo } from "react"
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Socials removed per minimal requirement

const AppErrorFallback = ({ error, resetErrorBoundary }) => {
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore()
  // Only reset boundary (no navigation back)
  const handleReset = () => {
    resetErrorBoundary();
  }

  const { themeStyles } = useMemo(() => {
    const textColor = isLight ? '#000' : '#fff'
    return {
      themeStyles: {
        textColor,
        surface: isLight ? '#ffffff' : '#000000',
        subtle: isLight ? '#e6e6e6' : '#1a1a1a',
        iconColor: textColor,
        buttonBg: isLight ? '#000000' : '#ffffff',
        buttonText: isLight ? '#ffffff' : '#000000',
        secondaryText: isLight ? '#666666' : '#999999',
        iconBg: isLight ? '#f5f5f5' : '#1a1a1a',
      }
    }
  }, [isLight])

  return (
    <View style={[styles.screen, { backgroundColor: themeStyles.surface, paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <View style={styles.centerWrap}>
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: themeStyles.iconBg }]}>
          <MaterialIcons name="error-outline" size={64} color={themeStyles.iconColor} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: themeStyles.textColor }]}>
          Oops! Something went wrong
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: themeStyles.secondaryText }]}>
          We encountered an unexpected error. Don't worry, you can try again.
        </Text>

        {/* Retry Button */}
        <Pressable 
          style={[styles.retryButton, { backgroundColor: themeStyles.buttonBg }]}
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <MaterialIcons name="refresh" size={18} color={themeStyles.buttonText} />
          <Text style={[styles.retryButtonText, { color: themeStyles.buttonText }]}>
            Try Again
          </Text>
        </Pressable>

        {/* Dev Error Message */}
        {__DEV__ && error?.message && (
          <View style={[styles.devErrorContainer, { backgroundColor: themeStyles.iconBg }]}>
            <Text style={[styles.devErrorLabel, { color: themeStyles.secondaryText }]}>
              Debug Info:
            </Text>
            <Text style={[styles.devErrorText, { color: themeStyles.textColor }]}>
              {error.message}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  screen: { 
    flex: 1 
  },
  centerWrap: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  devErrorContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    maxWidth: '100%',
  },
  devErrorLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  devErrorText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
})

export default AppErrorFallback