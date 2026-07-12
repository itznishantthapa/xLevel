import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { LoaderKitView } from 'react-native-loader-kit';
import MatchCardSkeleton from '../skeleton/Skeleton';
import { FlashList } from "@shopify/flash-list";
import { useThemeStore } from '../../../store/themeStore';
import { useBottomSheet } from '../../../context/BottomSheetContext';
import { AppIcon } from '../../../components/common/AppIcon';
import { Notification01Icon, NotificationOff01Icon } from '@hugeicons/core-free-icons';
import OpenGameCard from '../cards/OpenGameCard';
import { fontSize, spacing, iconSize } from '../../../theme/typography';
import { getGameCreationTopic, getGameCreationAlertCopy, getFcmBroadcastTopicForRole } from '../../../constants/notifications';
import {
  requestNotificationPermission,
  subscribeToTopic,
  unsubscribeFromTopic,
  syncFCMTokenWithBackend,
  subscribeToBroadcastTopic,
} from '../../../service/notificationService';
import { useAuthStore } from '../../../store/authStore';
import {
  isGameCreationTopicSubscribed,
  setGameCreationTopicSubscribed,
} from '../../../utils/gameCreationTopicStorage';

const getCompactGameName = (name = '') => name.replace(/\s+/g, '');

// Constants
const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 280;

/**
 * OpenGameList Component
 * Displays a list of available games with filtering options
 * 
 * @param {Array} games - Array of game objects to display
 * @param {function} handleConfirmChallenge - Callback when user joins a game
 * @param {boolean} isLoading - Whether games are loading
 * @param {boolean} isRefreshing - Whether list is refreshing
 * @param {boolean} isLoadingMore - Whether more games are being loaded
 * @param {boolean} hasMore - Whether there are more games to load
 * @param {function} onRefresh - Callback to refresh the list
 * @param {function} onLoadMore - Callback to load more games
 * @param {Array} gameModes - Available game modes for filtering
 * @param {string} gameName - Name of the current game
 * @param {function} onFilterChange - Callback when filter is changed
 * @param {boolean} showFilters - Whether to show game mode filters
 */
const OpenGameList = ({
  games,
  handleConfirmChallenge,
  handleReportUser,
  isLoading,
  isRefreshing,
  isLoadingMore,
  hasMore,
  onRefresh,
  onLoadMore,
  gameModes = [],
  gameName = "",
  onFilterChange = null,
  showFilters = false,
}) => {
  const { isLight } = useThemeStore();
  const userRole = useAuthStore((state) => state.user?.role);
  const { showGameCreationNotificationSheet } = useBottomSheet();
  const endReachedTimeoutRef = React.useRef(null);
  const hasUserScrolledRef = React.useRef(false);
  const [isEndDelay, setIsEndDelay] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState("All");
  const [isCreationSubscribed, setIsCreationSubscribed] = useState(false);
  const [isTopicLoading, setIsTopicLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptionState = async () => {
      const subscribed = await isGameCreationTopicSubscribed(gameName);
      if (isMounted) {
        setIsCreationSubscribed(subscribed);
      }
    };

    loadSubscriptionState();

    return () => {
      isMounted = false;
    };
  }, [gameName]);

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

  // Handle filter selection
  const handleFilterSelect = useCallback((filter) => {
    setSelectedFilter(filter);
    if (onFilterChange) {
      onFilterChange(filter);
    }
  }, [onFilterChange]);

  const handleSubscribeCreationTopic = useCallback(async () => {
    const topic = getGameCreationTopic(gameName);
    if (!topic) {
      Toast.show('Notifications are not available for this game yet.', Toast.SHORT);
      return;
    }

    setIsTopicLoading(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Toast.show('Notification permission is required.', Toast.SHORT);
        return;
      }

      await syncFCMTokenWithBackend();
      await subscribeToBroadcastTopic(getFcmBroadcastTopicForRole(userRole));

      const success = await subscribeToTopic(topic);
      if (!success) {
        Toast.show('Unable to turn on', Toast.SHORT);
        return;
      }

      await setGameCreationTopicSubscribed(gameName, true);
      setIsCreationSubscribed(true);

      const compactName = getCompactGameName(gameName).toLowerCase();
      console.log(`turning on ${compactName} game Notification`);
    } catch (error) {
      // Keep FCM and AsyncStorage in sync: if anything failed midway,
      // roll the FCM subscription back so the stored "false" stays truthful.
      await unsubscribeFromTopic(topic);
      try {
        await setGameCreationTopicSubscribed(gameName, false);
      } catch (storageError) {
        if (__DEV__) console.log('Topic storage rollback error:', storageError);
      }
      setIsCreationSubscribed(false);
      Toast.show('Unable to turn on', Toast.SHORT);
      if (__DEV__) console.log(`Subscribe creation topic error (${topic}):`, error);
    } finally {
      setIsTopicLoading(false);
    }
  }, [gameName, userRole]);

  const handleUnsubscribeCreationTopic = useCallback(async () => {
    const topic = getGameCreationTopic(gameName);
    if (!topic) return;

    setIsTopicLoading(true);
    try {
      const success = await unsubscribeFromTopic(topic);
      if (!success) {
        Toast.show('Unable to turn off', Toast.SHORT);
        return;
      }

      await setGameCreationTopicSubscribed(gameName, false);
      setIsCreationSubscribed(false);

      const compactName = getCompactGameName(gameName).toLowerCase();
      console.log(`turning off ${compactName} game Notification`);
    } catch (error) {
      Toast.show('Unable to turn off', Toast.SHORT);
      if (__DEV__) console.log(`Unsubscribe creation topic error (${topic}):`, error);
    } finally {
      setIsTopicLoading(false);
    }
  }, [gameName]);

  const handleNotificationPress = useCallback(() => {
    const alertCopy = getGameCreationAlertCopy(gameName, isCreationSubscribed);

    showGameCreationNotificationSheet({
      ...alertCopy,
      onConfirm: isCreationSubscribed
        ? handleUnsubscribeCreationTopic
        : handleSubscribeCreationTopic,
    });
  }, [
    gameName,
    handleSubscribeCreationTopic,
    handleUnsubscribeCreationTopic,
    isCreationSubscribed,
    showGameCreationNotificationSheet,
  ]);

  // Memoize the filter chips component
  const FilterChips = useMemo(() => {
    if (!showFilters) return null;

    const borderColor = isLight ? '#000000' : '#eaf4f4';
    const notificationButtonStyle = isTopicLoading
      ? { backgroundColor: isLight ? '#000000' : '#FFFFFF' }
      : isCreationSubscribed
        ? styles.notificationButtonSubscribed
        : styles.notificationButtonUnsubscribed;
    const notificationIcon = isCreationSubscribed ? Notification01Icon : NotificationOff01Icon;
    const loaderColor = isLight ? '#FFFFFF' : '#000000';

    return (
      <View style={[
        styles.filterChipsContainer,
        {
          backgroundColor: isLight ? 'transparent' : '#000000',
          borderBottomColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        },
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {gameModes.length > 0 ? (
            <>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { borderColor },
                  selectedFilter === 'All' && {
                    backgroundColor: isLight ? '#000000' : '#eaf4f4',
                    borderColor,
                  },
                ]}
                onPress={() => handleFilterSelect('All')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isLight ? '#000000' : '#eaf4f4' },
                    selectedFilter === 'All' && {
                      color: isLight ? '#ffffff' : '#000000',
                      fontWeight: '600',
                    },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {gameModes.map((mode, index) => (
                <TouchableOpacity
                  key={`${mode}-${index}`}
                  style={[
                    styles.filterChip,
                    { borderColor },
                    selectedFilter === mode && {
                      backgroundColor: isLight ? '#000000' : '#eaf4f4',
                      borderColor,
                    },
                  ]}
                  onPress={() => handleFilterSelect(mode)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isLight ? '#000000' : '#eaf4f4' },
                      selectedFilter === mode && {
                        color: isLight ? '#ffffff' : '#000000',
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </ScrollView>

        <Pressable
          style={[styles.notificationButton, notificationButtonStyle]}
          onPress={handleNotificationPress}
          disabled={isTopicLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isCreationSubscribed
              ? `Turn off ${gameName} game creation notifications`
              : `Turn on ${gameName} game creation notifications`
          }
        >
          {isTopicLoading ? (
            <LoaderKitView
              style={styles.notificationLoader}
              name="LineSpinFadeLoader"
              color={loaderColor}
              animationSpeedMultiplier={1.0}
            />
          ) : (
            <AppIcon icon={notificationIcon} size={iconSize.md} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    );
  }, [
    gameModes,
    gameName,
    handleFilterSelect,
    handleNotificationPress,
    isCreationSubscribed,
    isLight,
    isTopicLoading,
    selectedFilter,
    showFilters,
  ]);


  // Memoize the render item function for real match cards
  const renderMatchCard = ({ item }) => {
    const win_pot = Math.floor((item?.entry_fee || 0) * 2 * 0.9);
    return (
      <OpenGameCard
      win_pot={win_pot}
      game={item}
      handleConfirmChallenge={handleConfirmChallenge}
      handleReportUser={handleReportUser}
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
    contentContainerStyle: styles.scrollContent
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
          ListHeaderComponent={FilterChips}
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
  filterChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterScroll: {
    flex: 1,
  },
  filterScrollContent: {
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButtonSubscribed: {
    backgroundColor: '#00bf63',
    borderWidth: 0,
  },
  notificationButtonUnsubscribed: {
    backgroundColor: '#FF4444',
    borderWidth: 0,
  },
  notificationLoader: {
    width: 20,
    height: 20,
  },
  filterChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: fontSize.base,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#ffffff',

  },
  activeFilterChip: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: 'transparent',
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

export default OpenGameList;
