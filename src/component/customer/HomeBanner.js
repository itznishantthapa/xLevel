import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions,Linking } from 'react-native';
import PagerView from 'react-native-pager-view';


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
      
      {/* Page Indicator */}
      <View style={styles.paginationContainer}>
        {data?.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentPage === index && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    marginHorizontal: 5,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  bannerCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
    bannerContenterImage: {
    width: '100%',
    height: '100%',
  },
  
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default HomeBanner;
