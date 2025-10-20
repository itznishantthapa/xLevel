import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions, Linking } from 'react-native';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { scaleWidth, scaleHeight } from '../../utils/scaling';
import { useThemeStore } from '../../store/themeStore';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

const BannerPage = ({ data }) => {
  const handlePress = useCallback(() => {
    if (data?.url && !data.url.toLowerCase().includes('point')) {
      Linking.openURL(data.url).catch(err => {
        if (__DEV__) console.error('Error opening URL:', err);
      });
    }
  }, [data?.url]);

  const isPressable = data?.url && !data.url.toLowerCase().includes('point');

  return (
    <Pressable
      style={styles.pageContainer}
      onPress={isPressable ? handlePress : undefined}
      disabled={!isPressable}
    >
      <Image
        source={{ uri: data?.image }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </Pressable>
  );
};

// Optional `height` prop allows overriding banner height in dp; defaults to a compact height
const HomeBanner = ({ data = [], height }) => {
  const carouselRef = useRef(null);
  const progress = useSharedValue(0);
  const animatedProgress = useDerivedValue(() => progress.value);
  const { isLight } = useThemeStore();

  const wrapperBg = isLight ? '#ffffff' : '#000000';
  const { width } = Dimensions.get('window');
  // Match StatsContainer width (marginHorizontal: 10 on each side)
  const PAGE_WIDTH = width - 20;
  // Use provided height if passed, else a smaller default height
  const PAGE_HEIGHT = typeof height === 'number' ? height : scaleHeight(160);

  // Reset to beginning on screen focus
  useFocusEffect(
    useCallback(() => {
      progress.value = 0;
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.wrapper, { backgroundColor: wrapperBg, height: PAGE_HEIGHT }]}>
        <Carousel
          ref={carouselRef}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          autoPlay
          autoPlayInterval={5000}
          loop
          pagingEnabled
          data={data}
          style={{ width: '100%' }}
          onProgressChange={(_, absoluteProgress) => {
            // Update shared progress without reading during render
            progress.value = absoluteProgress;
          }}
          renderItem={({ item }) => <BannerPage data={item} />}
        />
      </View>

      <Pagination.Basic
        progress={animatedProgress}
        data={data}
        dotStyle={{
          width: scaleWidth(10),
          height: scaleWidth(10),
          borderRadius: scaleWidth(5),
          // Outlined ring for inactive dots
          backgroundColor: 'transparent',
          borderWidth: scaleWidth(1),
          borderColor: isLight ? "#000000" : '#ffffff'
        }}
        activeDotStyle={{
          width: scaleWidth(10),
          height: scaleWidth(10),
          borderRadius: scaleWidth(5),
          // Filled dot for active
          backgroundColor: isLight ? '#000000' : '#ffffff',
          borderWidth: 0,
          borderColor: isLight ? '#000000' : '#ffffff',

        }}
        containerStyle={{
          alignSelf: 'center',
          gap: 8,
          marginTop: scaleHeight(8),
 
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Match StatsContainer margin for equal overall width
    marginHorizontal: 10,
    marginBottom: scaleHeight(15),
    marginTop: scaleHeight(10),
  },
  wrapper: {
    // Height is controlled dynamically via inline style using PAGE_HEIGHT
    position: 'relative',
    // borderRadius: scaleWidth(20),
    overflow: 'hidden',
  
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(15),
  },
});

export default HomeBanner;