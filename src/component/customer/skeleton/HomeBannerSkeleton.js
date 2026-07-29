import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { spacing, radius } from '../../../theme/typography';
import { getBannerDimensions } from '../HomeBanner';

const HomeBannerSkeleton = () => {
  const { isLight } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();
  const { width: bannerWidth, height: bannerHeight } = useMemo(
    () => getBannerDimensions(screenWidth),
    [screenWidth],
  );

  const skeletonColor = isLight ? '#e8e8e8' : '#1a1a1a';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.banner,
          {
            width: bannerWidth,
            height: bannerHeight,
            backgroundColor: skeletonColor,
          },
        ]}
      />
    </View>
  );
};

export default HomeBannerSkeleton;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  banner: {
    borderRadius: radius.lg,
  },
});
