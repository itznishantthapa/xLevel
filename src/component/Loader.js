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
  size = 56,
  animationName = 'BallPulse',
  backdropOpacity,
  testID = 'app-loader',
}) => {
  const { isLight } = useThemeStore();

  const [shouldRender, setShouldRender] = useState(visible);
  const backdropOpacityAnimated = useRef(new Animated.Value(0)).current;
  const scaleAnimated = useRef(new Animated.Value(0.98)).current;

  const colors = useMemo(() => {
    const surface = isLight ? '#ffffff' : '#121212';
    const text = isLight ? '#111111' : '#EEEEEE';
    const spinner = isLight ? '#111111' : '#FFFFFF';
    const overlayOpacity =
      typeof backdropOpacity === 'number'
        ? Math.max(0, Math.min(1, backdropOpacity))
        : isLight
        ? 0.28
        : 0.35;
    const overlay = `rgba(0,0,0,${overlayOpacity})`;
    return { surface, text, spinner, overlay };
  }, [isLight, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(backdropOpacityAnimated, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimated, {
          toValue: 1,
          speed: 14,
          bounciness: 6,
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
          toValue: 0.98,
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
            { backgroundColor: colors.overlay, opacity: backdropOpacityAnimated },
          ]}
          pointerEvents="auto"
          accessibilityLiveRegion="polite"
          testID={testID}
        >
          <Animated.View
            style={[
              styles.loaderContainer,
              styles.shadow,
              { backgroundColor: colors.surface, transform: [{ scale: scaleAnimated }] },
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
        </Animated.View>
      ) : null}
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    minWidth: 160,
    maxWidth: '80%',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },

  loaderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
