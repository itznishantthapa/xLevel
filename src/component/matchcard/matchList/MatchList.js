import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MatchCardSkeleton from '../skeleton/Skeleton';
import { FlashList } from "@shopify/flash-list";
import { useThemeStore } from '../../../store/themeStore';
import AppHeader from '../../../screens/customer/header/AppHeader';
import { useAuthStore } from '../../../store/authStore';
import CreatorMatchCard from '../cards/CreatorMatchCard';
import OpponentMatchCard from '../cards/OpponentMatchCard';






// Constants
const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 280;

/**
 * MatchesList Component
 */
const MatchList = ({
  games,
  handleSendGameCredentials,
  handleResultUpload,
  isLoading,
  isRefreshing,
  isLoadingMore,
  hasMore,
  onRefresh,
  onLoadMore,
  handleAcceptChallengeOnCopy,
  handleDeleteChallenge,
  handleConfirmedOpponent,
  handleLeaveChallenge,
  handleIssue
}) => {
  const { isLight } = useThemeStore();
  const { user } = useAuthStore();
  const endReachedTimeoutRef = React.useRef(null);
  const hasUserScrolledRef = React.useRef(null);
  const [isEndDelay, setIsEndDelay] = React.useState(false);

  // Create skeleton data for loading state
  const skeletonData = useMemo(() => 
    Array(3).fill(null).map((_, index) => ({ id: `skeleton-${index}` }))
  , []);

  const handleEndReached = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    if (isRefreshing) return;
    if (!hasUserScrolledRef.current) return;
    if (endReachedTimeoutRef.current) return;
    setIsEndDelay(true);
    endReachedTimeoutRef.current = setTimeout(() => {
      endReachedTimeoutRef.current = null;
      setIsEndDelay(false);
      onLoadMore?.();
    }, 400);
  }, [hasMore, isLoadingMore, onLoadMore, isRefreshing]);

  React.useEffect(() => () => {
    if (endReachedTimeoutRef.current) {
      clearTimeout(endReachedTimeoutRef.current);
      endReachedTimeoutRef.current = null;
    }
  }, []);

  // Reset flags on external refresh
  React.useEffect(() => {
    if (isRefreshing) {
      hasUserScrolledRef.current = false;
      if (endReachedTimeoutRef.current) {
        clearTimeout(endReachedTimeoutRef.current);
        endReachedTimeoutRef.current = null;
      }
      setIsEndDelay(false);
    }
  }, [isRefreshing]);

  // Memoize the header component
  const HeaderComponent = useMemo(() => (
      <AppHeader
        backButton={true}
        title={'My Matches'}
      />
  ), [isLight]);



  // Memoize the render item function for real match cards
  const renderMatchCard = ({ item }) => {
    const isCreator = user?.id === item?.created_by?.id;
    const win_pot = (item?.entry_fee * 2 * 0.9).toFixed(0);

    return isCreator? (

    <CreatorMatchCard
      game={item}
      win_pot={win_pot}
      isCreator={isCreator}
      handleSendGameCredentials={handleSendGameCredentials}
      handleResultUpload={handleResultUpload}
      handleDeleteChallenge={handleDeleteChallenge}
      handleConfirmedOpponent={handleConfirmedOpponent}
      handleIssue={handleIssue}
    />
    ):(
        <OpponentMatchCard
          game={item}
          win_pot={win_pot}
          isCreator={isCreator}
          handleSendGameCredentials={handleSendGameCredentials}
          handleResultUpload={handleResultUpload}
          handleAcceptChallengeOnCopy={handleAcceptChallengeOnCopy}
          handleDeleteChallenge={handleDeleteChallenge}
          handleLeaveChallenge={handleLeaveChallenge}
          handleIssue={handleIssue}
        />
    )
    

}
  
  // Memoize the render item function for skeleton cards
  const renderSkeletonItem = useCallback(({ item }) => (
    <MatchCardSkeleton isLight={isLight} />
  ), [isLight]);

  // Memoize FlashList props
  const flashListProps = useMemo(() => ({
    estimatedItemSize: ITEM_HEIGHT,
    estimatedListSize: { height, width },
    showsVerticalScrollIndicator: false,
  }), []);
  
  // Determine which data to show based on loading state
  const dataToShow = isLoading ? skeletonData : (games || []);

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlashList
          {...flashListProps}
          data={dataToShow}
          renderItem={isLoading ? renderSkeletonItem : renderMatchCard}
          keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : `match-${item.id}-${index}`}
          ListHeaderComponent={HeaderComponent}
          contentContainerStyle={{
            paddingBottom: 40
          }}
          onScroll={(e) => {
            const y = e?.nativeEvent?.contentOffset?.y ?? 0;
            if (y > 0) hasUserScrolledRef.current = true;
          }}
          scrollEventThrottle={16}
          ListFooterComponent={
            (!isLoading && games?.length > 0 && (hasMore || isLoadingMore || isEndDelay))? (
              <View style={styles.footerContainer}>
                {
                (isLoadingMore || isEndDelay) ? (
                  <ActivityIndicator size="small" color={isLight ? '#333333' : '#ffffff'} />
                ) : null}
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0}
          ListEmptyComponent={isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isLight ? '#333333' : '#ffffff' }]}>No matches available</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={isLight ? "#333333" : "#ffffff"}
              colors={[isLight ? "#333333" : "#ffffff"]}
              progressBackgroundColor={isLight ? "#ffffff" : "#000000"}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 0,
    marginBottom: 10,
    zIndex: 10,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  // Card styles - common for both real and skeleton cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#333333',
  },
  cardContent: {
    padding: 15,
  },
  mainSection: {
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    paddingRight: 8,
  },
  rightSection: {
    flex: 1,
    paddingLeft: 8,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  dividerDark: {
    backgroundColor: '#333333',
  },
  profileSkeleton: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  skeletonName: {
    height: 14,
    width: '70%',
    marginBottom: 6,
  },
  skeletonId: {
    height: 12,
    width: '50%',
  },
  footerSkeleton: {
    marginTop: 12,
  },
  skeletonButton: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
  },
});

export default MatchList;
