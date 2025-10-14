import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions, Linking } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scaleWidth, scaleHeight } from '../../utils/scaling';
import { useThemeStore } from '../../store/themeStore';


const BannerPage = ({ data }) => {
  const handlePress = () => {
    // Don't open URLs that include 'point'
    if (data?.url && !data.url.toLowerCase().includes('point')) {
      Linking.openURL(data.url).catch(err => {
        if(__DEV__) {
        console.error('Error opening URL:', err);
        }
      });
    }
  };

  // Only make it pressable if URL exists and doesn't include 'point'
  const isPressable = data?.url && !data.url.toLowerCase().includes('point');

  return (
    <Pressable 
      style={styles.pageContainer} 
      activeOpacity={0.9}
      onPress={isPressable ? handlePress : undefined}
    >
      <View style={styles.bannerCard}>
        <Image 
          source={{uri: data?.image}} 
          style={styles.bannerContenterImage} 
          resizeMode="cover"
        />
      </View>
    </Pressable>
  );
};

const AnimatedIndicator = ({ isActive, isLight }) => {
  const scale = useSharedValue(isActive ? 1 : 0.8);

  useEffect(() => {
    // Smooth easing animation with scale
    scale.value = withTiming(isActive ? 1 : 0.8, {
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Theme-aware colors
  const dotStyle = isLight 
    ? (isActive ? styles.indicatorDotActiveLightMode : styles.indicatorDotLightMode)
    : (isActive ? styles.indicatorDotActiveDarkMode : styles.indicatorDotDarkMode);

  return (
    <Animated.View
      style={[
        styles.indicatorDot,
        animatedStyle,
        dotStyle,
      ]}
    />
  );
};

const HomeBanner = ({data}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { isLight } = useThemeStore();

  const handlePageChange = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  // Theme-aware colors
  const indicatorColors = {
    active: isLight ? '#000000' : '#FFFFFF',
    inactive: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
  };

  return (
    <View style={styles.container}>
      <View style={styles.bannerWrapper}>
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageChange}
        >
          {data?.map((banner) => (
            <View key={banner.id}>
              <BannerPage data={banner} onPress={banner.onPress} />
            </View>
          ))}
        </PagerView>
        
        {/* Circular Dot Indicators - Over Banner */}
        <View style={styles.indicatorContainer}>
          {data?.map((_, index) => (
            <AnimatedIndicator
              key={index}
              isActive={currentPage === index}
              isLight={isLight}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scaleWidth(10),
    marginTop: scaleHeight(-45),
    marginBottom: scaleHeight(15),
    zIndex: 10,
  },
  bannerWrapper: {
    height: scaleHeight(180),
    position: 'relative',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: scaleWidth(5),
  },
  bannerCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: scaleWidth(20),
    width: '100%',
    overflow: 'hidden',
  },
  bannerContenterImage: {
    width: '100%',
    height: '100%',
  },
  
  // Circular dot indicators - over banner
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: scaleHeight(12),
    left: 0,
    right: 0,
    gap: scaleWidth(8),
  },
  indicatorDot: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
  // Light mode styles
  indicatorDotLightMode: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  indicatorDotActiveLightMode: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  // Dark mode styles
  indicatorDotDarkMode: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  indicatorDotActiveDarkMode: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default HomeBanner;
