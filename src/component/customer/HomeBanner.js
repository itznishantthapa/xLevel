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


const BannerPage = ({ data }) => {
  const handlePress = () => {
    if (data?.url) {
      Linking.openURL(data.url).catch(err => {
        if(__DEV__) {
        console.error('Error opening URL:', err);
        }
      });
    }
  };

  return (
    <Pressable 
      style={styles.pageContainer} 
      activeOpacity={0.9}
      onPress={data?.url ? handlePress : undefined}
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

const AnimatedIndicator = ({ isActive, index, totalPages }) => {
  const width = useSharedValue(isActive ? scaleWidth(24) : scaleWidth(8));
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    width.value = withTiming(
      isActive ? scaleWidth(24) : scaleWidth(8),
      {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }
    );
    opacity.value = withTiming(
      isActive ? 1 : 0.4,
      {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }
    );
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.indicatorLine,
        animatedStyle,
      ]}
    />
  );
};

const HomeBanner = ({data}) => {
  const [currentPage, setCurrentPage] = useState(0);

 

  const handlePageChange = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  return (
    <View style={styles.container}>
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
      
      {/* Animated Line Indicators */}
      <View style={styles.indicatorContainer}>
        {data?.map((_, index) => (
          <AnimatedIndicator
            key={index}
            isActive={currentPage === index}
            index={index}
            totalPages={data.length}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: scaleHeight(180),
    marginHorizontal: scaleWidth(5),
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
  
  title: {
    color: '#ffffff',
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    marginVertical: scaleHeight(10),
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: scaleWidth(14),
    fontWeight: '600',
  },

  // New animated indicator styles
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: scaleHeight(12),
    left: 0,
    right: 0,
    gap: scaleWidth(6),
  },
  indicatorLine: {
    height: scaleHeight(5),
    backgroundColor: '#ffffff',
    borderRadius: scaleWidth(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Deprecated dot styles (keeping for reference, can be removed)
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: scaleHeight(10),
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: scaleWidth(8),
    height: scaleHeight(8),
    borderRadius: scaleWidth(4),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: scaleWidth(4),
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: scaleWidth(12),
    height: scaleHeight(12),
    borderRadius: scaleWidth(6),
  },
});

export default HomeBanner;
