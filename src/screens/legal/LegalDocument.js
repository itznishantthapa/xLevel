import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import WebView from 'react-native-webview';
import { getLegalDocument } from '../../constants/legalUrls';
import { useThemeStore } from '../../store/themeStore';
import AppHeader from '../customer/header/AppHeader';
import { fontSize, spacing } from '../../theme/typography';

const buildInjectedStyleScript = (isLight) => {
  const background = isLight ? '#ffffff' : '#000000';
  const text = isLight ? '#111111' : '#f5f5f5';
  const muted = isLight ? '#666666' : '#999999';

  return `
    (function () {
      var style = document.createElement('style');
      style.textContent = \`
        html, body {
          background: ${background} !important;
          color: ${text} !important;
        }
        body {
          margin: 0 !important;
          padding: 8px 12px 40px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          font-size: 15px !important;
          line-height: 1.65 !important;
        }
        h1, h2, h3, h4, h5, h6 {
          color: ${text} !important;
          line-height: 1.3 !important;
        }
        p, li, span, div, td, th {
          color: ${muted} !important;
        }
        a {
          color: ${text} !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
      \`;
      document.head.appendChild(style);
    })();
    true;
  `;
};

export default function LegalDocument() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const document = useMemo(
    () => getLegalDocument(route.params?.type),
    [route.params?.type],
  );

  const injectedJavaScript = useMemo(
    () => buildInjectedStyleScript(isLight),
    [isLight],
  );

  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    text: isLight ? '#000000' : '#ffffff',
    textSecondary: isLight ? '#666666' : '#999999',
    border: isLight ? '#000000' : '#ffffff',
  };

  if (!document) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <AppHeader backButton title="Document" />
        <View style={styles.messageWrap}>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            This document is unavailable.
          </Text>
        </View>
      </View>
    );
  }

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />
      <AppHeader backButton title={document.title} />

      <View style={styles.content}>
        {hasError ? (
          <View style={styles.messageWrap}>
            <Text style={[styles.messageTitle, { color: colors.text }]}>
              Unable to load page
            </Text>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>
              Check your connection and try again.
            </Text>
            <Pressable
              onPress={handleRetry}
              style={[styles.retryButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading document"
            >
              <Text style={[styles.retryButtonText, { color: colors.text }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.text}
                style={styles.loader}
              />
            ) : null}

            <WebView
              key={reloadKey}
              source={{ uri: document.url }}
              style={[styles.webView, { backgroundColor: colors.background }]}
              injectedJavaScript={injectedJavaScript}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              showsVerticalScrollIndicator={false}
              originWhitelist={['*']}
              startInLoadingState={false}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  messageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  messageTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
