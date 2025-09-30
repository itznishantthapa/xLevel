import React, { useMemo, useState, useCallback } from 'react'
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { MaterialIcons, MaterialCommunityIcons, SimpleLineIcons, Octicons } from '@expo/vector-icons'
import Toast from "react-native-simple-toast"
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useLeaderboard } from '../../queries/useLeaderboard'
import { queryClient } from '../../lib/queryClient'
import AppHeader from './header/AppHeader'
import Loader from '../../component/Loader'
import { scaleWidth } from '../../utils/scaling'

const { width, height } = Dimensions.get('window')
const ITEM_HEIGHT = 80 // Height of each leaderboard card

 

/**
 * LeaderboardCard Component
 * Renders individual leaderboard entry with rank, profile, name, and points
 */
const LeaderboardCard = React.memo(({ user, isLight, isCurrentUser = false }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return  <SimpleLineIcons name='trophy' size={24} color={isLight ? '#333333' : '#EAEAEA'} />
      case 2:
        return <SimpleLineIcons name='trophy' size={24} color={isLight ? '#333333' : '#EAEAEA'} />
      case 3:
        return <SimpleLineIcons name='trophy' size={24} color={isLight ? '#333333' : '#EAEAEA'} />
      default:
        return (
          <View style={[styles.rankBadge, { backgroundColor: isLight ? '#f0f0f0' : 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.rankText, { color: isLight ? '#666666' : '#ffffff' }]}>
              {rank}
            </Text>
          </View>
        )
    }
  }

  const { rank, full_name, profile_picture, wallet_balance } = user

  return (
    <View style={styles.cardContainer}>
      <View style={[
        styles.card,
        { 
          backgroundColor: isCurrentUser 
            ? (isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)') 
            : (isLight ? '#ffffff' : '#000000'),
          borderColor: isLight ? '#333333' : '#dadada',
          borderWidth: 1
        },
        isCurrentUser && { borderWidth: 2, borderColor: isLight ? '#000000' : '#ffffff' }
      ]}>
        {/* Rank Section */}
        <View style={styles.rankSection}>
          {getRankIcon(rank)}
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profile_picture ? (
              <Image
                source={{ uri: profile_picture }}
                style={styles.profileImage}
                defaultSource={{ uri: 'https://via.placeholder.com/50x50/cccccc/666666?text=User' }}
              />
            ) : (
              <View style={[styles.profileImageFallback, { backgroundColor: isLight ? '#f0f0f0' : 'rgba(255, 255, 255, 0.1)' }]}>
                <Octicons name="feed-person" size={24} color={isLight ? '#666666' : '#ffffff'} />
              </View>
            )}
            
               {/* (createdBy?.active_hacker_tag || createdBy?.active_pro_tag) && ( */}
            {/* Pro/Hckr Tag */}
            {(user.active_pro_tag || user.active_hacker_tag) && (
              <View style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: [{ translateX: -12 }],
                backgroundColor: isLight ? '#000000' : '#ffffff',
                paddingHorizontal: scaleWidth(6),
                paddingVertical: scaleWidth(2),
                borderRadius: scaleWidth(8),
                borderWidth: scaleWidth(1),
                borderColor: isLight ? '#ffffff' : '#000000',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Text style={{
                  color: isLight ? '#ffffff' : '#000000',
                  fontSize: scaleWidth(8),
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {user.active_hacker_tag ? 'Hckr' : 'Pro'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: isLight ? '#333333' : '#ffffff' }]} numberOfLines={1}>
              {full_name}
            </Text>
            {isCurrentUser && (
              <View style={[styles.currentUserBadge, { backgroundColor: isLight ? '#000000' : '#ffffff' }]}>
                <Text style={[styles.currentUserText, { color: isLight ? '#ffffff' : '#000000' }]}>You</Text>
              </View>
            )}
          </View>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsLabel, { color: '#00bf63' }]}>Points </Text>
            <Text style={[styles.pointsText, { color: isLight ? '#333333' : '#ffffff' }]}>
              {typeof wallet_balance === "number" ? wallet_balance.toFixed(2) : wallet_balance || 0}
            </Text>
          </View>
        </View>

 
      </View>
    </View>
  )
})

/**
 * Empty List Component
 */
const EmptyListComponent = ({ isLight }) => (
  <View style={styles.emptyContainer}>
    <SimpleLineIcons 
      name="trophy" 
      size={64} 
      color={isLight ? '#cccccc' : 'rgba(255, 255, 255, 0.3)'} 
    />
    <Text style={[styles.emptyTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
      No Leaderboard Data
    </Text>
    <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)' }]}>
      Play more games to see the leaderboard rankings
    </Text>
  </View>
)

/**
 * Header Component
 */
const HeaderComponent = () => (
  <AppHeader title={'Leaderboard'} 
  backButton={Platform.OS === 'ios'}
  />
)

/**
 * Main Leaderboard Component
 */
const Leaderboard = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data, isFetching, refetch } = useLeaderboard()
  
  const insets = useSafeAreaInsets()
  const { isConnected } = useNetworkStatus()

  // Extract leaderboard users and user rank from API response
  const leaderboardData = data?.leaderboard_users ?? []
  const userRank = data?.user_rank

  // Check if current user is in top 25
  const isUserInTop25 = leaderboardData.some(leaderUser => leaderUser.id === user?.id)

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT)
      return
    }

    setIsRefreshing(true)
    try {
      // Clear cache and refetch
      queryClient.removeQueries({ queryKey: ["leaderboard"] })
      await refetch()
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to refresh leaderboard:', error)
      }
    } finally {
      // Always ensure refreshing state is reset
      setIsRefreshing(false)
    }
  }, [isConnected, refetch])

  // Render leaderboard card
  const renderLeaderboardCard = useMemo(() => (
    ({ item }) => (
      <LeaderboardCard 
        user={item} 
        isLight={isLight} 
        isCurrentUser={item.id === user?.id}
      />
    )
  ), [isLight, user?.id])

  // Current User Footer Component
  const CurrentUserFooter = () => {
    if (!user || !userRank) return null
    
    return (
      <View style={[styles.userRankContainer, { backgroundColor: isLight ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)' }]}>
        <View style={styles.currentUserHeader}>
          <Text style={[styles.sectionTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
            Your Position
          </Text>
        </View>
        
        <View style={[
          styles.currentUserCard,
          { 
            backgroundColor: isLight ? '#ffffff' : '#000000',
            borderColor: isLight ? '#000000' : '#ffffff',
            borderWidth: 2
          }
        ]}>
          {/* Rank Section */}
          <View style={styles.rankSection}>
            <View style={[styles.rankBadge, { backgroundColor: isLight ? '#000000' : '#ffffff' }]}>
              <Text style={[styles.rankText, { color: isLight ? '#ffffff' : '#000000' }]}>
                {userRank}
              </Text>
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {user.profile_picture ? (
                <Image
                  source={{ uri: user.profile_picture }}
                  style={styles.profileImage}
                  defaultSource={{ uri: 'https://via.placeholder.com/50x50/cccccc/666666?text=User' }}
                />
              ) : (
                <View style={[styles.profileImageFallback, { backgroundColor: isLight ? '#f0f0f0' : 'rgba(255, 255, 255, 0.1)' }]}>
                  <Octicons name="feed-person" size={24} color={isLight ? '#666666' : '#ffffff'} />
                </View>
              )}
                {/* (createdBy?.active_hacker_tag || createdBy?.active_pro_tag) && ( */}
              {/* Pro/Hckr Tag */}
              {(user?.enhancer?.active_pro_tag || user?.enhancer?.active_hacker_tag) && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: [{ translateX: -12 }],
                  backgroundColor: isLight ? '#000000' : '#ffffff',
                  paddingHorizontal: scaleWidth(6),
                  paddingVertical: scaleWidth(2),
                  borderRadius: scaleWidth(8),
                  borderWidth: scaleWidth(1),
                  borderColor: isLight ? '#ffffff' : '#000000',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Text style={{
                    color: isLight ? '#ffffff' : '#000000',
                    fontSize: scaleWidth(8),
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {user?.enhancer?.active_hacker_tag ? 'Hckr' : 'Pro'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userName, { color: isLight ? '#333333' : '#ffffff' }]} numberOfLines={1}>
                {user.full_name || 'You'}
              </Text>
 
            </View>
            <View style={styles.pointsContainer}>
              <Text style={[styles.pointsLabel, { color: '#00bf63' }]}>Points </Text>
              <Text style={[styles.pointsText, { color: isLight ? '#333333' : '#ffffff' }]}>
                {typeof user.wallet_balance === "number" ? user.wallet_balance.toFixed(2) : user.wallet_balance || 0}
              </Text>
            </View>
          </View>

          {/* Trophy Icon */}
          <View style={styles.chevronSection}>
          <SimpleLineIcons name='trophy' size={24} color={isLight ? '#333333' : '#ffffff'} />
          </View>
        </View>
                      
 
      </View>
    )
  }

  // FlashList props
  const flashListProps = useMemo(() => ({
    estimatedItemSize: ITEM_HEIGHT,
    estimatedListSize: { height, width },
    initialNumToRender: 25, // Show all 25 users at once
    showsVerticalScrollIndicator: false,
    contentContainerStyle: styles.listContainer,
  }), [])

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isLight ? '#ffffff' : '#000000', 
        paddingTop: insets.top,
      }
    ]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      
      <View style={styles.listWrapper}>
        <FlashList
          {...flashListProps}
          data={isFetching && leaderboardData.length === 0 ? [] : leaderboardData}
          renderItem={renderLeaderboardCard}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={<HeaderComponent />}
          ListEmptyComponent={isFetching ? null : <EmptyListComponent isLight={isLight} />}
          ListFooterComponent={CurrentUserFooter}
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
      
      {/* Loading indicator for initial load */}
      <Loader visible={isFetching && leaderboardData.length === 0} />
    </View>
  )
}

export default React.memo(Leaderboard)

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
  },
  
  // Card Styles
  cardContainer: {
    marginHorizontal: 5,
    marginVertical: 4,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ITEM_HEIGHT - 8,
  },
  
  // Rank Section
  rankSection: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Profile Section
  profileSection: {
    marginRight: 12,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  profileImageFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // User Info Section
  userInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  currentUserBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  currentUserText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
 
  
  // Empty State
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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Loading Indicator
  loadingIndicator: {
    marginVertical: 10,
  },
  
  // User Rank Footer
  userRankContainer: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  currentUserHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentUserCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ITEM_HEIGHT - 8,
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userRankText: {
    fontSize: 16,
    fontWeight: '600',
  },
})