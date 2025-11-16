import React, { useMemo, useCallback } from 'react'
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  RefreshControl,
  Image,
  Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons, SimpleLineIcons, Octicons, Ionicons } from '@expo/vector-icons'
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
        return <SimpleLineIcons name='trophy' size={24} color="#FFD700" /> // Gold
      case 2:
        return <SimpleLineIcons name='trophy' size={24} color="#C0C0C0" /> // Silver
      case 3:
        return <SimpleLineIcons name='trophy' size={24} color="#CD7F32" /> // Bronze
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
            : (isLight ? '#fefffe' : '#000000'),
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
            <MaterialCommunityIcons 
              name="star-four-points-outline" 
              size={14} 
              color="#00bf63" 
              style={styles.pointsIcon}
            />
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
  backButton={true}
  />
)

/**
 * Main Leaderboard Component
 */
const Leaderboard = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const { data, isFetching, refetch } = useLeaderboard()
  
  const insets = useSafeAreaInsets()
  const { isConnected } = useNetworkStatus()

  // Extract leaderboard users and user rank from API response
  const leaderboardData = data?.leaderboard_users ?? []
  const userRank = data?.user_rank

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT)
      return
    }

    try {
      // Clear cache and refetch
      queryClient.removeQueries({ queryKey: ["leaderboard"] })
      await refetch()
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to refresh leaderboard:', error)
      }
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

  // Fixed footer height for proper spacing
  const FOOTER_HEIGHT = 140

  // FlashList props
  const flashListProps = useMemo(() => ({
    estimatedItemSize: ITEM_HEIGHT,
    estimatedListSize: { height: height - FOOTER_HEIGHT, width },
    initialNumToRender: 25, // Show all 25 users at once
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingBottom: user && userRank ? FOOTER_HEIGHT + 10 : 20
    },
  }), [user, userRank])

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
      
      <HeaderComponent />
      <View style={styles.listWrapper}>
        <FlashList
          {...flashListProps}
          data={isFetching && leaderboardData.length === 0 ? [] : leaderboardData}
          renderItem={renderLeaderboardCard}
          keyExtractor={(item) => item.id.toString()}
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
      
      {/* Fixed Current User Position Footer */}
      {user && userRank && (
        <View style={[
          styles.fixedUserFooter,
          { 
            backgroundColor: isLight ? '#ffffff' : '#000000',
            borderTopColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)',
            paddingBottom: insets.bottom,
          }
        ]}>
          <View style={styles.fixedFooterContent}>
            <View style={styles.fixedSectionTitleContainer}>
              <Ionicons 
                name="sparkles-sharp" 
                size={20} 
                color={isLight ? '#333333' : '#ffffff'} 
                style={styles.sparklesIcon}
              />
              <Text style={[styles.fixedSectionTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
                Your Position
              </Text>
            </View>
            
            <View style={[
              styles.fixedCurrentUserCard,
              { 
                backgroundColor: isLight ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLight ? '#000000' : '#ffffff',
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
                  <MaterialCommunityIcons 
                    name="star-four-points-outline" 
                    size={14} 
                    color="#00bf63" 
                    style={styles.pointsIcon}
                  />
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
        </View>
      )}
      
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
  
  // Card Styles
  cardContainer: {
    marginHorizontal: 8,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ITEM_HEIGHT - 8,
  },
  
  // Rank Section
  rankSection: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  rankText: {
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Profile Section
  profileSection: {
    marginRight: 16,
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // User Info Section
  userInfoSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  currentUserBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  currentUserText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsIcon: {
    marginRight: 2,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Chevron Section
  chevronSection: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  
  // Fixed Footer Styles
  fixedUserFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  fixedFooterContent: {
    paddingHorizontal: 16,
  },
  fixedSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sparklesIcon: {
    marginRight: 8,
  },
  fixedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  fixedCurrentUserCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
})