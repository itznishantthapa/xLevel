import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, Pressable, RefreshControl, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../../store/themeStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import AppHeader from '../header/AppHeader'
import { useIssues } from '../../../queries/useIssue'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { queryClient } from '../../../lib/queryClient'
import Loader from '../../../component/Loader'

const Issue = () => {
  const { isLight } = useThemeStore()
  const insets = useSafeAreaInsets()
    const { isConnected } = useNetworkStatus();


    const PAGE_SIZE = 10;
    
    const { 
      data: { flat: issues = [], hasMore = false } = {},
      fetchNextPage, 
      isFetchingNextPage, 
      isLoading: issuesLoading,
      isError,
      error,
      refetch,
      isRefetching
    } = useIssues(PAGE_SIZE) 



  
  // Mock data for issues - replace with actual API call later
  const [issues1, setIssues] = useState([
    {
      id: 1,
      challenge_id: 75,
      issue_type: "mistake_setting",
      description: "Game settings were different from what was mentioned by creator",
      status: "pending",
      created_at: "2025-09-08T10:42:15.862150Z",
      resolved_at: null,
      admin_notes: null,
      game_name: "PUBG Mobile",
      game_mode: "Team Death Match"
    },
    {
      id: 2,
      challenge_id: 76,
      issue_type: "offline",
      description: "Connection lost during the game",
      status: "resolved",
      created_at: "2025-09-08T10:43:36.779575Z",
      resolved_at: "2025-09-08T14:30:00.000000Z",
      admin_notes: "Issue resolved - credits returned to user",
      game_name: "eFootball",
      game_mode: "Friend Match"
    },
    {
      id: 3,
      challenge_id: 77,
      issue_type: "opponent_not_joined",
      description: "Opponent didn't join after credentials were provided",
      status: "under_review",
      created_at: "2025-09-07T15:20:10.123456Z",
      resolved_at: null,
      admin_notes: null,
      game_name: "Chess",
      game_mode: "Blitz"
    },
    {
      id: 4,
      challenge_id: 78,
      issue_type: "creator_not_provided",
      description: "Creator never provided room credentials",
      status: "rejected",
      created_at: "2025-09-06T09:15:30.987654Z",
      resolved_at: "2025-09-07T11:00:00.000000Z",
      admin_notes: "Insufficient evidence provided",
      game_name: "Call of Duty",
      game_mode: "Clash Squad"
    }
  ])
  
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false)

  // Colors based on theme
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#333333" : "#ffffff",
    subText: isLight ? "#000000" : "#ffffff",
    card: isLight ? "#ffffff" : "#000000",
    cardBorder: isLight ? "#333333" : "#ffffff",
    pending:isLight ? "#0000000" : "#ffffff",
    resolved: "#00C851",
    under_review: isLight ? "#0000000" : "#ffffff",
    rejected: isLight ? "#0000000" : "#ffffff",
    bottomLine: isLight ? "#e0e0e0" : "rgba(255, 255, 255, 0.1)",
  }

  /**
   * Format date to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status icon based on issue status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <Ionicons name="checkmark-circle" size={18} color={colors.resolved} />
      case 'pending':
        return <MaterialIcons name="pending-actions" size={18} color={colors.pending} />
      case 'rejected':
        return <MaterialIcons name="cancel" size={18} color={colors.rejected} />
      case 'under_review':
        return <MaterialIcons name="sync" size={18} color={colors.under_review} />
      default:
        return null
    }
  }

  /**
   * Get issue type icon
   */
  const getIssueTypeIcon = (type) => {
    switch (type) {
      case 'mistake_setting':
        return <MaterialIcons name="settings" size={18} color={colors.text} />
      case 'mistake_credentials':
        return <MaterialIcons name="lock" size={18} color={colors.text} />
      case 'opponent_not_joined':
        return <MaterialIcons name="person-off" size={18} color={colors.text} />
      case 'creator_not_provided':
        return <MaterialIcons name="person-remove" size={18} color={colors.text} />
      case 'offline':
        return <MaterialIcons name="wifi-off" size={18} color={colors.text} />
      default:
        return <MaterialIcons name="report-problem" size={18} color={colors.text} />
    }
  }

  /**
   * Get issue type display name
   */
  const getIssueTypeDisplayName = (type) => {
    switch (type) {
      case 'mistake_setting':
        return 'Game Settings Issue'
      case 'mistake_credentials':
        return 'Wrong Credentials'
      case 'opponent_not_joined':
        return "Opponent Didn't Join"
      case 'creator_not_provided':
        return "Creator Didn't Provide"
      case 'offline':
        return 'Offline/Connection Lost'
      default:
        return 'Issue Report'
    }
  }

  /**
   * Capitalize first letter of a string
   */
  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).replace('_', ' ')
  }





    /**
   * Handle refresh for issue list
   */
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT);
      return;
    }
    
    setIsManualRefreshing(true);
    try {
      // Clear the issues query from cache and refetch
      queryClient.removeQueries({ queryKey: ["issues", PAGE_SIZE] });
      await refetch();

    } catch (error) {
      if (__DEV__) {
        console.log("Failed to refresh issues:", error);
      }
    } finally {
      // Always ensure refreshing state is reset
      setIsManualRefreshing(false);
    }
  }, [refetch, isConnected, PAGE_SIZE]);

  /**
   * Render an issue card
   */
  const renderIssueCard = useCallback(({ item }) => (
    <View style={styles.issueCardContainer}>
      <View
        style={[
          styles.issueCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Header with issue ID and date */}
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={[styles.idLabel, { color: colors.subText }]}>Issue #{item.id}</Text>
            <Text style={[styles.gameInfo, { color: colors.text }]}>{item.game_name} - {item.game_mode}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.subText }]}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Main issue details */}
        <View style={styles.mainDetails}>
          <View style={styles.typeContainer}>
            {/* <View style={styles.typeIconContainer}>
              {getIssueTypeIcon(item.issue_type)}
            </View> */}
            <View>
              <Text style={[styles.typeLabel, { color: colors.subText }]}>Issue Type</Text>
              <Text style={[styles.typeValue, { color: colors.text }]}>{getIssueTypeDisplayName(item.issue_type)}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusIconContainer}>
              {getStatusIcon(item.status)}
            </View>
            <Text style={[styles.statusText, { color: colors[item.status] }]}>{capitalize(item.status)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionLabel, { color: colors.subText }]}>Description:</Text>
          <Text style={[styles.descriptionValue, { color: colors.text }]} numberOfLines={3}>{item.description}</Text>
        </View>

        {/* Admin notes if available */}
        {item.admin_notes && (
          <View style={[styles.notesContainer, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : '#1a1a1a' }]}>
            <Text style={[styles.notesLabel, { color: colors.subText }]}>Admin Notes</Text>
            <Text style={[styles.notesValue, { color: colors.text }]}>{item.admin_notes}</Text>
          </View>
        )}

        {/* Resolved info if available */}
        {item.resolved_at && (
          <View style={styles.resolvedContainer}>
            <Text style={[styles.resolvedText, { color: colors.subText }]}>
              Resolved on {formatDate(item.resolved_at)}
            </Text>
          </View>
        )}

        <View style={[styles.bottomLine, { backgroundColor: colors.bottomLine }]} />
      </View>
    </View>
  ), [colors, isLight])

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />

      {/* Header */}
      <AppHeader
        backButton={Platform.OS === 'ios'} // Show back button only on iOS
        title={'Reported Issues'}
      />
      <Loader visible={issuesLoading || isManualRefreshing} message="Loading issues..." />
      {/* Issue List */}
      {!issuesLoading && !isManualRefreshing && issues.length === 0  ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="report-off" size={64} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No issues reported yet</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderIssueCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={handleRefresh}
              tintColor={isLight ? "#000000" : "#ffffff"}
              colors={[isLight ? "#000000" : "#ffffff"]}
              progressBackgroundColor={isLight ? "#f0f0f0" : "#333333"}
              progressViewOffset={10}
              style={{ backgroundColor: 'transparent' }}
            />
          }
        />
      )}
    </View>
  )
}

export default React.memo(Issue)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
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
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  issueCardContainer: {
    marginBottom: 12,
  },
  issueCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  idContainer: {
    flex: 1,
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconContainer: {
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  notesValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  resolvedContainer: {
    marginBottom: 12,
  },
  resolvedText: {
    fontSize: 12,
  },
  bottomLine: {
    width: "100%",
    height: 1,
  },
})