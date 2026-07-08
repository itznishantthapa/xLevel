import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import MatchCardSkeleton from '../skeleton/Skeleton';
import { FlashList } from "@shopify/flash-list";
import { useThemeStore } from '../../../store/themeStore';
import AppHeader from '../../../screens/customer/header/AppHeader';
import OpenGameCard from '../cards/OpenGameCard';
import { fontSize, spacing } from '../../../theme/typography';

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
  const endReachedTimeoutRef = React.useRef(null);
  const hasUserScrolledRef = React.useRef(false);
  const [isEndDelay, setIsEndDelay] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState("All");

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

  // Memoize the filter chips component
  const FilterChips = useMemo(() => {
    if (!showFilters || !gameModes || gameModes.length === 0) return null;
    
    return (
      <View style={[
        styles.filterChipsContainer, 
        { backgroundColor: isLight ? 'transparent' : '#000000', borderBottomColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 10 }}
        >
          {/* All filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: isLight ? '#000000' : '#eaf4f4' },
              selectedFilter === "All" && { 
                backgroundColor: isLight ? '#000000' : '#eaf4f4',
                borderColor: isLight ? '#000000' : '#eaf4f4' 
              },
              !selectedFilter === "All" && {
                backgroundColor: 'transparent'
              }
            ]}
            onPress={() => handleFilterSelect("All")}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: isLight ? '#000000' : '#eaf4f4' },
                selectedFilter === "All" && { 
                  color: isLight ? '#ffffff' : '#000000',
                  fontWeight: '600' 
                }
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Mode specific chips */}
          {gameModes.map((mode, index) => (
            <TouchableOpacity
              key={`${mode}-${index}`}
              style={[
                styles.filterChip,
                { borderColor: isLight ? '#000000' : '#eaf4f4' },
                selectedFilter === mode && { 
                  backgroundColor: isLight ? '#000000' : '#eaf4f4',
                  borderColor: isLight ? '#000000' : '#eaf4f4'
                },
                !selectedFilter === mode && {
                  backgroundColor: 'transparent'
                }
              ]}
              onPress={() => handleFilterSelect(mode)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isLight ? '#000000' : '#eaf4f4' },
                  selectedFilter === mode && { 
                    color: isLight ? '#ffffff' : '#000000',
                    fontWeight: '600'
                  }
                ]}
              >
                {mode}
              </Text>
            </TouchableOpacity>
          ))}


        </ScrollView>
      </View>
    );
  }, [gameModes, games?.length, handleFilterSelect, isLight, selectedFilter, showFilters]);


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
    paddingVertical: 8,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
