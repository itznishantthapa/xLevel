import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LoaderKitView } from 'react-native-loader-kit';
import { useThemeStore } from '../store/themeStore';

const Loader = ({
  visible = false,
  message = 'Loading…',
  size = 16, // Reduced default size for a sleeker horizontal box
  animationName = 'LineSpinFadeLoader',
  backdropOpacity,
  fullScreen = false,
  testID = 'app-loader',
}) => {
  const { isLight } = useThemeStore();

  const [shouldRender, setShouldRender] = useState(visible);
  const backdropOpacityAnimated = useRef(new Animated.Value(0)).current;
  const scaleAnimated = useRef(new Animated.Value(0.95)).current;

  const spinnerSize = fullScreen ? 32 : size;

  const colors = useMemo(() => {
    const defaultOverlayOpacity = isLight ? 0.3 : 0.5;
    const finalOpacity = typeof backdropOpacity === 'number' ? Math.max(0, Math.min(1, backdropOpacity)) : defaultOverlayOpacity;

    if (fullScreen) {
      return {
        surface: isLight ? '#FFFFFF' : '#000000',
        text: isLight ? 'rgba(17, 17, 17, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        spinner: isLight ? '#111111' : '#FFFFFF',
        overlay: isLight ? '#FFFFFF' : '#000000',
      };
    }

    return {
      surface: isLight ? '#FFFFFF' : '#1E1E1E',
      text: isLight ? '#333333' : '#E0E0E0',
      spinner: isLight ? '#111111' : '#FFFFFF',
      overlay: `rgba(0,0,0,${finalOpacity})`,
    };
  }, [isLight, backdropOpacity, fullScreen]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(backdropOpacityAnimated, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimated, {
          toValue: 1,
          speed: fullScreen ? 16 : 14,
          bounciness: fullScreen ? 0 : 2, // Kept very low for a sharp, rigid box entrance
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacityAnimated, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimated, {
          toValue: 0.95,
          duration: 150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible, backdropOpacityAnimated, scaleAnimated, fullScreen]);

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      {shouldRender ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.backdrop,
            fullScreen && styles.fullScreenBackdrop,
            { backgroundColor: colors.overlay, opacity: backdropOpacityAnimated },
          ]}
          pointerEvents="auto"
          accessibilityLiveRegion="polite"
          testID={testID}
        >
          {fullScreen ? (
            <Animated.View
              style={[
                styles.fullScreenContent,
                { transform: [{ scale: scaleAnimated }] },
              ]}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={message || 'Loading'}
            >
              <View style={styles.fullScreenLoader}>
                <LoaderKitView
                  style={{ width: spinnerSize, height: spinnerSize }}
                  name={animationName}
                  color={colors.spinner}
                  animationSpeedMultiplier={0.85}
                />
              </View>
              {message ? (
                <Text style={[styles.fullScreenLoaderText, { color: colors.text }]} numberOfLines={2}>
                  {message}
                </Text>
              ) : null}
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.loaderContainer,
                {
                  backgroundColor: colors.surface,
                  transform: [{ scale: scaleAnimated }],
                },
              ]}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={message || 'Loading'}
            >
              <LoaderKitView
                style={{ width: size, height: size }}
                name={animationName}
                color={colors.spinner}
                animationSpeedMultiplier={1.0}
              />
              {message ? (
                <Text style={[styles.loaderText, { color: colors.text }]} numberOfLines={2}>
                  {message}
                </Text>
              ) : null}
            </Animated.View>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  fullScreenBackdrop: {
    paddingTop: 0,
  },
  fullScreenContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  fullScreenLoader: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    maxWidth: '85%',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 0,
  },
  loaderText: {
    marginLeft: 18, // Creates the gap between the loader (left) and text (right)
    marginTop: 0, // Removed top margin
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left', // Aligns text cleanly against the left margin
    flex: 1, // Ensures text wraps cleanly instead of overflowing if it gets too long
  },
  fullScreenLoaderText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 20,
    maxWidth: 220,
  },
});