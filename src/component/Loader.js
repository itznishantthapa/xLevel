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
  size = 16,
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
    const finalOpacity =
      typeof backdropOpacity === 'number'
        ? Math.max(0, Math.min(1, backdropOpacity))
        : defaultOverlayOpacity;

    return {
      surface: isLight ? '#FFFFFF' : '#1E1E1E',
      text: isLight ? '#333333' : '#E0E0E0',
      spinner: isLight ? '#111111' : '#FFFFFF',
      overlay: fullScreen
        ? isLight
          ? '#FFFFFF'
          : '#000000'
        : `rgba(0,0,0,${finalOpacity})`,
      boxBorder: isLight ? '#E8E8E8' : 'transparent',
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
          speed: 14,
          bounciness: 2,
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
  }, [visible, backdropOpacityAnimated, scaleAnimated]);

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
          <Animated.View
            style={[
              styles.loaderContainer,
              fullScreen && styles.fullScreenLoaderContainer,
              {
                backgroundColor: colors.surface,
                borderColor: fullScreen ? colors.boxBorder : 'transparent',
                transform: [{ scale: scaleAnimated }],
              },
            ]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={message || 'Loading'}
          >
            <LoaderKitView
              style={{ width: spinnerSize, height: spinnerSize }}
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
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    maxWidth: '85%',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 0,
  },
  fullScreenLoaderContainer: {
    borderWidth: 1,
  },
  loaderText: {
    marginLeft: 18,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
    flex: 1,
  },
});
