import React, { useMemo, useState, useCallback } from 'react'
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
  RefreshControl,
  Image,
  Pressable,
  Alert,
  Platform,
  FlatList
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons, MaterialCommunityIcons, Octicons, FontAwesome5 } from '@expo/vector-icons'
import Toast from "react-native-simple-toast"
import { useThemeStore } from '../../store/themeStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useBottomSheet } from '../../context/BottomSheetContext'
import { queryClient } from '../../lib/queryClient'
import { useBlockedUsers } from '../../queries/useBlockedUsers'
import { unblockUser } from '../../api/blockApi'
import AppHeader from './header/AppHeader'
import Loader from '../../component/Loader'

const { width, height } = Dimensions.get('window')
const ITEM_HEIGHT = 100 // Height of each blocked user card




/**
 * BlockedUserCard Component
 * Renders individual blocked user entry with profile, name, reason, and unblock button
 */
const BlockedUserCard = React.memo(({ blockedUser, isLight, onUnblock }) => {
  const { block_id, user_id, full_name, profile_picture, reason, blocked_at } = blockedUser

  // Format blocked date for display
  const formatBlockedDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleUnblock = () => {
    onUnblock(blockedUser)
  }




  return (
    <View style={styles.cardContainer}>
      <View style={[
        styles.card,
        {
          backgroundColor: isLight ? 'transparent' : '#000000',
          borderColor: isLight ? '#333333' : '#dadada',
          borderWidth: 1
        }
      ]}>

        {/* Profile Section */}
        <View style={styles.profileSection}>
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
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: isLight ? '#333333' : '#ffffff' }]} numberOfLines={1}>
              {full_name}
            </Text>
          </View>
          <View style={styles.reasonContainer}>
            <Text style={[styles.reasonLabel, { color: '#FF4444' }]}>Reason: </Text>
            <Text style={[styles.reasonText, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)' }]} numberOfLines={1}>
              {reason}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: isLight ? '#999999' : 'rgba(255, 255, 255, 0.5)' }]}>
              Blocked on {formatBlockedDate(blocked_at)}
            </Text>
          </View>
        </View>

        {/* Unblock Button Section */}
        <View style={styles.actionSection}>
          <Pressable
            style={[styles.unblockButton, {
              backgroundColor: isLight ? '#000000' : '#ffffff',
              borderColor: isLight ? '#000000' : '#ffffff'
            }]}
            onPress={handleUnblock}
          >
            <Text style={[styles.unblockButtonText, {
              color: isLight ? '#ffffff' : '#000000'
            }]}>
              Unblock
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
})

/**
 * Main BlockedUserList Component
 */
const BlockedUserList = () => {
  const { isLight } = useThemeStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { showConfirmSheet } = useBottomSheet()

  const insets = useSafeAreaInsets()
  const { isConnected } = useNetworkStatus()

  // Fetch blocked users from API
  const { data, isFetching, refetch } = useBlockedUsers()
  const blockedUsers = data?.blocked_users ?? []

  // Handle unblock user
  const handleUnblockUser = useCallback((blockedUser) => {
    showConfirmSheet({
      title: "Unblock User?",
      message: `Are you sure you want to unblock ${blockedUser.full_name}? Their content will be visible to you again.`,
      confirmText: "Unblock",
      cancelText: "Cancel",
      isDestructive: true, // This will make the button use the normal theme colors
      onConfirm: async () => {
        try {
          setIsLoading(true)

          // Call unblock API with the user_id
          await unblockUser({ reportedUserId: blockedUser.user_id })

          // Refresh the blocked users list
          queryClient.removeQueries({ queryKey: ['blockedUsers'] })
          await refetch()

        } catch (error) {
          Toast.show(error.message || 'Failed to unblock user.')

        } finally {
          setIsLoading(false)
        }
      }
    })
  }, [showConfirmSheet, refetch])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT)
      return
    }
    setIsRefreshing(true)
    try {
      queryClient.removeQueries({ queryKey: ['blockedUsers'] })
      await refetch()
    } catch (e) {
      if (__DEV__) console.log('Failed to refresh blocked users:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [isConnected, refetch])

  // Render blocked user card
  const renderBlockedUserCard = useMemo(() => (
    ({ item }) => (
      <BlockedUserCard
        blockedUser={item}
        isLight={isLight}
        onUnblock={handleUnblockUser}
      />
    )
  ), [isLight, handleUnblockUser])

  // Empty component for when no blocked users
  const listEmptyComponent = useMemo(() => (
    !isFetching ? (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="users-slash" size={64} color={isLight ? "#333333" : "#ffffff"} />
        <Text style={[styles.emptyText, { color: isLight ? "#333333" : "#ffffff" }]}>No blocked users</Text>
        <Text style={[styles.pullText, { color: isLight ? '#666666' : 'rgba(255,255,255,0.6)' }]}>Pull down to refresh</Text>
      </View>
    ) : null
  ), [isFetching, isLight])

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

      {/* Header - Always visible */}
      <AppHeader title={'Blocked Users'}
        backButton={true} // Show back button only on iOS
      />

      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUserCard}
        keyExtractor={(item) => item.block_id?.toString?.() || String(item.index)}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={isLight ? "#000000" : "#ffffff"}
            colors={[isLight ? "#000000" : "#ffffff"]}
            progressBackgroundColor={isLight ? "#f0f0f0" : "#333333"}
            progressViewOffset={10}
            style={{ backgroundColor: 'transparent' }}
          />
        }
      />

      {/* Loading indicator for initial load and unblock operations */}
      <Loader visible={isLoading || (isFetching && blockedUsers.length === 0)} />
    </View>
  )
}

export default React.memo(BlockedUserList)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
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




  // Profile Section
  profileSection: {
    marginRight: 12,
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
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
  dateContainer: {
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '400',
  },

  // Action Section
  actionSection: {
    marginLeft: 12,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  pullText: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
})