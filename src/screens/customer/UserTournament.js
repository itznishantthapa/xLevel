import { StyleSheet, Text, View, ActivityIndicator, StatusBar, Dimensions, RefreshControl, Platform } from 'react-native'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useThemeStore } from '../../store/themeStore'
import TournamentCard from '../../component/customer/TournamentCard'
import NoGamesView from '../../component/customer/NoGameView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { useInfiniteTournaments } from '../../queries/useTournament'
import Loader from '../../component/Loader'
import AppHeader from './header/AppHeader'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import Toast from 'react-native-simple-toast'
import { queryClient } from '../../lib/queryClient'

const { width, height } = Dimensions.get('window')
const ITEM_HEIGHT = 350 // Approximate height of tournament card

// Pre-define static components
const EmptyListComponent = ({ isLight }) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
      No Tournaments
    </Text>
    <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)' }]}>
      You haven't joined any tournaments yet
    </Text>
  </View>
)

const HeaderComponent = () => (
    <AppHeader 
      title="My Tournaments" 
      backButton={Platform.OS === 'ios'}
    />

)

const UserTournament = () => {
  const insets = useSafeAreaInsets()
  const { isLight } = useThemeStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { isConnected } = useNetworkStatus()

  const {
    data: { flat: tournaments = [], hasMore = false } = {},
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
    refetch
  } = useInfiniteTournaments(5)


  useEffect(() => {
  console.log('UserTournament component rendered. Tournaments count:', tournaments);
  }, [tournaments])
  

  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isFetchingNextPage) {
      try {
        await fetchNextPage()
      } catch (error) {
        // Handle error silently
      }
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage])

  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT)
      return
    }
    
    setIsRefreshing(true)
    try {
      // Clear the tournaments query from cache and refetch
      queryClient.removeQueries({ queryKey: ["tournaments", 5] })
      await refetch()
    } catch (error) {
      if (__DEV__) {
        console.log("Failed to refresh tournaments:", error)
      }
    } finally {
      // Always ensure refreshing state is reset
      setIsRefreshing(false)
    }
  }, [refetch, isConnected])

  // Memoize the render item function
  const renderTournamentCard = useCallback(({ item }) => (
    <TournamentCard game={item} />
  ), [])

  // Memoize FlashList props
  const flashListProps = useMemo(() => ({
    estimatedItemSize: ITEM_HEIGHT,
    estimatedListSize: { height, width },
    initialNumToRender: 5,
    drawDistance: ITEM_HEIGHT * 2,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: styles.listContainer,
    onEndReached: handleLoadMore,
    onEndReachedThreshold: 0,
  }), [handleLoadMore])

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      <View style={styles.listWrapper}>
        <FlashList
          {...flashListProps}
          data={isFetching && tournaments.length === 0 ? [] : tournaments}
          renderItem={renderTournamentCard}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={() => <HeaderComponent />}
          ListEmptyComponent={isFetching ? null : <EmptyListComponent isLight={isLight} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              colors={[isLight ? '#000000' : '#ffffff']}
              tintColor={isLight ? '#000000' : '#ffffff'}
              progressBackgroundColor={isLight ? '#ffffff' : '#000000'}
            />
          }
        />
      </View>
      <Loader visible={isFetching && tournaments.length === 0} />
      {isFetchingNextPage && (
        <ActivityIndicator 
          style={styles.loadingMore} 
          size="small" 
          color={isLight ? '#333333' : '#ffffff'} 
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
    width: width,
    height: height,
  },
  listContainer: {
    paddingBottom: 50,
  },
  headerContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    marginTop: 10,
    marginBottom: 10,
  },
});

export default React.memo(UserTournament);