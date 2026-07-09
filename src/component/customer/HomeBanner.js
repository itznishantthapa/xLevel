import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Image, Pressable, useWindowDimensions, Linking, Platform } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { interpolate, Extrapolation } from 'react-native-reanimated';
import { spacing, radius } from '../../theme/typography';

const BANNER_BORDER_RADIUS = radius.lg;
const BANNER_HORIZONTAL_PADDING = spacing.lg;
const BANNER_ASPECT_RATIO = 16 / 9; // width : height

/** Recommended Canva export size — matches on-screen 16:9 ratio at retina density */
export const BANNER_DESIGN_WIDTH = 1280;
export const BANNER_DESIGN_HEIGHT = 720;

export const getBannerDimensions = (screenWidth) => {
  const width = Math.round(screenWidth - BANNER_HORIZONTAL_PADDING * 2);
  const height = Math.round(width / BANNER_ASPECT_RATIO);
  return { width, height };
};

const roundedClipStyle = {
  borderRadius: BANNER_BORDER_RADIUS,
  overflow: 'hidden',
  ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' } : null),
};

// Pure crossfade — no translateX, so pages never visually slide.
// Only opacity (and a whisper of scale) changes as `value` moves from -1 → 0 → 1.
const fadeAnimation = (value) => {
  'worklet';

  const absValue = Math.abs(value);

  const opacity = interpolate(absValue, [0, 1], [1, 0], Extrapolation.CLAMP);
  const scale = interpolate(absValue, [0, 1], [1, 0.96], Extrapolation.CLAMP);

  return {
    transform: [{ translateX: 0 }, { scale }],
    opacity,
    zIndex: absValue < 0.5 ? 10 : 0,
  };
};

const BannerPage = ({ data, width, height }) => {
  const handlePress = useCallback(() => {
    if (data?.url) {
      Linking.openURL(data.url).catch((err) => {
        if (__DEV__) console.error('Error opening URL:', err);
      });
    }
  }, [data?.url]);

  const isPressable = !!data?.url;

  return (
    <Pressable
      style={[styles.pageContainer, { width, height }]}
      onPress={isPressable ? handlePress : undefined}
      disabled={!isPressable}
    >
      <View style={[styles.imageClip, roundedClipStyle]} collapsable={false}>
        <Image source={{ uri: data?.image }} style={styles.bannerImage} resizeMode="cover" />
      </View>
    </Pressable>
  );
};

const HomeBanner = ({ data = [] }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { width: bannerWidth, height: bannerHeight } = useMemo(
    () => getBannerDimensions(screenWidth),
    [screenWidth],
  );

  if (!data.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, roundedClipStyle, { width: bannerWidth, height: bannerHeight }]}>
        <Carousel
          width={bannerWidth}
          height={bannerHeight}
          autoPlay={data.length > 1}
          autoPlayInterval={5000}
          loop={data.length > 1}
          pagingEnabled
          windowSize={5}
          data={data}
          containerStyle={[styles.carouselContainer, roundedClipStyle, { width: bannerWidth, height: bannerHeight }]}
          style={[styles.carousel, roundedClipStyle, { width: bannerWidth, height: bannerHeight }]}
          scrollAnimationDuration={700}
          customAnimation={fadeAnimation}
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
          renderItem={({ item }) => (
            <BannerPage data={item} width={bannerWidth} height={bannerHeight} />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  wrapper: {
    width: '100%',
  },
  carouselContainer: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    position: 'absolute', // keeps pages stacked in place so the fade doesn't reveal a gap
    width: '100%',
    height: '100%',
  },
  imageClip: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});

export default HomeBanner;