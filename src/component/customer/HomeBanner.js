import React, { useCallback } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions, Linking } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { interpolate, Extrapolation } from 'react-native-reanimated';
import { spacing, radius } from '../../theme/typography';

const BANNER_BORDER_RADIUS = radius.lg;
const HORIZONTAL_PADDING = spacing.lg;

const bannerScaleAnimation = (value) => {
  'worklet';

  const absValue = Math.abs(value);
  const scale = interpolate(absValue, [0, 0.5], [1, 0.88], Extrapolation.CLAMP);
  const isActive = absValue < 0.5;

  return {
    transform: [{ scale }],
    opacity: isActive ? 1 : 0,
    zIndex: isActive ? 10 : 0,
  };
};

const BannerPage = ({ data, height }) => {
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
      style={[styles.pageContainer, { height }]}
      onPress={isPressable ? handlePress : undefined}
      disabled={!isPressable}
    >
      <View style={[styles.imageClip, { height }]}>
        <Image source={{ uri: data?.image }} style={styles.bannerImage} resizeMode="cover" />
      </View>
    </Pressable>
  );
};

const HomeBanner = ({ data = [], height }) => {
  const { width } = Dimensions.get('window');
  const PAGE_WIDTH = width - HORIZONTAL_PADDING * 2;
  const PAGE_HEIGHT = typeof height === 'number' ? height : Math.round(PAGE_WIDTH * (9 / 16));

  if (!data.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { width: PAGE_WIDTH, height: PAGE_HEIGHT }]}>
        <Carousel
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          autoPlay={data.length > 1}
          autoPlayInterval={5000}
          loop={data.length > 1}
          pagingEnabled
          windowSize={5}
          data={data}
          style={styles.carousel}
          scrollAnimationDuration={500}
          customAnimation={bannerScaleAnimation}
          renderItem={({ item }) => <BannerPage data={item} height={PAGE_HEIGHT} />}
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
    borderRadius: BANNER_BORDER_RADIUS,
    overflow: 'hidden',
  },
  carousel: {
    borderRadius: BANNER_BORDER_RADIUS,
    overflow: 'hidden',
  },
  pageContainer: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: BANNER_BORDER_RADIUS,
  },
  imageClip: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: BANNER_BORDER_RADIUS,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: BANNER_BORDER_RADIUS,
  },
});

export default HomeBanner;
