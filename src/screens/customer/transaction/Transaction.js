import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, Pressable, RefreshControl } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useThemeStore } from '../../../store/themeStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTransactions } from '../../../queries/useTransaction'
import Loader from '../../../component/Loader'
import AppHeader from '../header/AppHeader'
import { queryClient } from '../../../lib/queryClient'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import Toast from 'react-native-simple-toast'


const Transaction = () => {
  const { isLight } = useThemeStore()
  const insets = useSafeAreaInsets()

  // Use our custom hook for transactions with pagination
  // Add local state to manage refresh state
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { isConnected } = useNetworkStatus();

  const PAGE_SIZE = 8;

  const {
    data: { flat: transactions = [], hasMore = false } = {},
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useTransactions(PAGE_SIZE) // Fetch 8 items per page
  // Colors based on theme
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#333333" : "#ffffff",
    subText: isLight ? "#000000" : "#ffffff",
    card: isLight ? "#ffffff" : "#000000",
    cardBorder: isLight ? "#333333" : "#ffffff",
    success: "#00C851",
    pending: "#FFBB33",
    rejected: "#FF4444",
    processing: "#33B5E5",
    credit: "#00C851",
    withdraw: "#FF8800",
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
   * Get status icon based on transaction status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      case 'pending':
        return <MaterialIcons name="pending-actions" size={18} color={colors.pending} />
      case 'rejected':
        return <MaterialIcons name="cancel" size={18} color={colors.rejected} />
      case 'processing':
        return <MaterialIcons name="sync" size={18} color={colors.processing} />
      default:
        return null
    }
  }

  /**
   * Get transaction type icon
   */
  const getTypeIcon = (type) => {
    switch (type) {
      case 'credit':
        return <FontAwesome name="arrow-circle-down" size={18} color={colors.credit} />
      case 'withdraw':
        return <FontAwesome name="arrow-circle-up" size={18} color={colors.withdraw} />
      default:
        return null
    }
  }

  /**
   * Capitalize first letter of a string
   */
  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  /**
   * Handle loading more transactions when reaching the end of the list
   */
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isFetchingNextPage) {
      try {
        await fetchNextPage();
      } catch (error) {
        // Handle error silently
        if (__DEV__) {
          console.error("Error loading more transactions:", error);
        }
      }
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  /**
   * Handle refresh for transactions list
   */
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT);
      return;
    }

    setIsManualRefreshing(true);
    try {
      // Clear the transactions query from cache and refetch
      queryClient.removeQueries({ queryKey: ["transactions", PAGE_SIZE] });
      await refetch();
    } catch (error) {
      if (__DEV__) {
        console.log("Failed to refresh transactions:", error);
      }
    } finally {
      // Always ensure refreshing state is reset
      setIsManualRefreshing(false);
    }
  }, [refetch, isConnected, PAGE_SIZE]);

  /**
   * Render a transaction card
   */
  const renderTransactionCard = useCallback(({ item }) => (
    <View style={styles.transactionCardContainer}>
      <View
        style={[
          styles.transactionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Header with transaction code and date */}
        <View style={styles.cardHeader}>
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: colors.subText }]}>Transaction ID</Text>
            <Text style={[styles.codeValue, { color: colors.text }]}>{item.transaction_code}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.subText }]}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Main transaction details */}
        <View style={styles.mainDetails}>
          <View style={styles.amountContainer}>
            <View style={styles.typeIconContainer}>
              {getTypeIcon(item.type)}
            </View>
            <View>
              <Text style={[styles.amountLabel, { color: colors.subText }]}>{capitalize(item.type)}</Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>Rs. {item.amount}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusIconContainer}>
              {getStatusIcon(item.status)}
            </View>
            <Text style={[styles.statusText, { color: colors[item.status] }]}>{capitalize(item.status)}</Text>
          </View>
        </View>

        {/* Admin notes if available */}
        {item.admin_notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: colors.subText }]}>Admin Notes:</Text>
            <Text style={[styles.notesValue, { color: colors.text }]}>{item.admin_notes}</Text>
          </View>
        )}

        {/* Processed info if available */}
        {item.processed_at && (
          <View style={styles.processedContainer}>
            <Text style={[styles.processedText, { color: colors.subText }]}>
              Processed on {formatDate(item.processed_at)}
            </Text>
          </View>
        )}

        <View style={[styles.bottomLine, { backgroundColor: colors.bottomLine }]} />
      </View>
    </View>
  ), [colors])

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />

      {/* Header */}
      <AppHeader
        backButton={true}
        title={'Transaction History'}
      />

      {/* Transaction List */}
      {/* Loader for initial loading - don't show during pull-to-refresh */}
      <Loader visible={isLoading || isManualRefreshing} message="Loading transactions..." />


      {/* Always show content during manual refresh, otherwise only when not loading */}
      {!isLoading && !isManualRefreshing && transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons  name="star-four-points-outline" size={64} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No transactions done yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => handleRefresh()}
              tintColor={isLight ? "#000000" : "#ffffff"}
              colors={[isLight ? "#000000" : "#ffffff"]}
              progressBackgroundColor={isLight ? "#f0f0f0" : "#333333"}
              progressViewOffset={10}
              style={{ backgroundColor: 'transparent' }}
            />
          }
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={isLight ? "#000000" : "#ffffff"} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

export default React.memo(Transaction)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerLoader: {
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  headerUnderline: {
    width: 80,
    height: 2,
    borderRadius: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  transactionCardContainer: {
    marginBottom: 12,
  },
  transactionCard: {
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
  codeContainer: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    marginRight: 8,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
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
  notesContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  processedContainer: {
    marginBottom: 12,
  },
  processedText: {
    fontSize: 12,
    // fontStyle: 'italic',
  },
  bottomLine: {
    width: "100%",
    height: 1,
  },
})