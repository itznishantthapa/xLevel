import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WifiError01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { AppIcon } from '../components/common/AppIcon';
import { fontSize, iconSize, radius, spacing } from '../theme/typography';
import { useThemeStore } from '../store/themeStore';

const NoConnection = ({ onRetry }) => {
  const { isLight } = useThemeStore();
  const [isRetrying, setIsRetrying] = useState(false);

  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    title: isLight ? '#000000' : '#ffffff',
    subtitle: isLight ? '#666666' : '#999999',
    iconWrap: isLight ? '#f5f5f5' : '#141414',
    icon: isLight ? '#000000' : '#ffffff',
    buttonBg: isLight ? '#000000' : '#ffffff',
    buttonText: isLight ? '#ffffff' : '#000000',
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.iconWrap }]}>
          <AppIcon icon={WifiError01Icon} size={48} color={colors.icon} strokeWidth={1.5} />
        </View>

        <Text style={[styles.title, { color: colors.title }]}>
          No Internet Connection
        </Text>

        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          Check your connection and try again. We will reload the app once you are back online.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.buttonBg, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleRetry}
          disabled={isRetrying}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <AppIcon icon={RefreshIcon} size={iconSize.md} color={colors.buttonText} />
          )}
          <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default NoConnection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing['3xl'],
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 168,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
