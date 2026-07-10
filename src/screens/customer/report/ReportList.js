import { StyleSheet, Text, View, FlatList, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useCallback, useState, useMemo } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../../components/common/AppIcon';
import {
  CheckmarkCircle01Icon,
  HourglassIcon,
  Cancel01Icon,
  RefreshIcon,
  Alert01Icon,
  Share02Icon,
  Flag01Icon,
  Image01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { iconSize } from '../../../theme/typography';
import AppHeader from '../header/AppHeader';
import { useReports } from '../../../queries/useReports';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { queryClient } from '../../../lib/queryClient';
import Loader from '../../../component/Loader';
import Toast from 'react-native-simple-toast';

const ReportList = () => {
  const { isLight } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();

  const PAGE_SIZE = 10;

  const {
    data: { flat: reports = [], hasMore = false } = {},
    fetchNextPage,
    isFetchingNextPage,
    isLoading: reportsLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useReports(PAGE_SIZE);

  // Filter out any undefined or null items
  const validReports = reports.filter(item => item && item.id);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Colors based on theme
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#333333" : "#ffffff",
    subText: isLight ? "#000000" : "#ffffff",
    card: isLight ? "transparent" : "#000000",
    cardBorder: isLight ? "#333333" : "#ffffff",
    pending: isLight ? "#0000000" : "#ffffff",
    resolved: "#00C851",
    under_review: isLight ? "#0000000" : "#ffffff",
    rejected: isLight ? "#0000000" : "#ffffff",
    bottomLine: isLight ? "#e0e0e0" : "rgba(255, 255, 255, 0.1)",
    destructive: "#FF4444",
  };

  /**
   * Format date to readable format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status icon based on report status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.sm} color={colors.resolved} />;
      case 'pending':
        return <AppIcon icon={HourglassIcon} size={iconSize.sm} color={colors.pending} />;
      case 'rejected':
        return <AppIcon icon={Cancel01Icon} size={iconSize.sm} color={colors.rejected} />;
      case 'under_review':
        return <AppIcon icon={RefreshIcon} size={iconSize.sm} color={colors.under_review} />;
      default:
        return null;
    }
  };

  /**
   * Get report type icon
   */
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'game_issue':
        return <AppIcon icon={Alert01Icon} size={iconSize.sm} color="#ff4444" />;
      case 'refund_agreement':
        return <AppIcon icon={Share02Icon} size={iconSize.sm} color="#00bf63" />;
      default:
        return <AppIcon icon={Flag01Icon} size={iconSize.sm} color={colors.text} />;
    }
  };

  /**
   * Get report type display name
   */
  const getReportTypeDisplayName = (type) => {
    switch (type) {
      case 'game_issue':
        return 'Game Issue';
      case 'refund_agreement':
        return 'Refund Agreement';
      default:
        return 'Report';
    }
  };

  /**
   * Capitalize first letter of a string
   */
  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).replace('_', ' ');
  };

  /**
   * Handle refresh for report list
   */
  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show("No internet connection.", Toast.SHORT);
      return;
    }

    setIsManualRefreshing(true);
    try {
      // Clear the reports query from cache and refetch
      queryClient.removeQueries({ queryKey: ["reports", PAGE_SIZE] });
      await refetch();
    } catch (error) {
      if (__DEV__) {
        console.log("Failed to refresh reports:", error);
      }
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch, isConnected, PAGE_SIZE]);

  /**
   * Handle loading more reports when scrolling to the bottom
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingNextPage && !isFetching && isConnected) {
      fetchNextPage();
    }
  }, [hasMore, isFetchingNextPage, isFetching, isConnected, fetchNextPage]);

  /**
   * Render a report card
   */
  const renderReportCard = useCallback(({ item }) => {
    // Safety check
    if (!item || !item.id) {
      return null;
    }

    return (
    <View style={styles.reportCardContainer}>
      <View
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Header with report ID and date */}
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={[styles.idLabel, { color: colors.subText }]}>Report #{item.id}</Text>
            <Text style={[styles.gameInfo, { color: colors.text }]}>
              {item.game_name || 'Unknown Game'} - {item.game_mode || 'Unknown Mode'}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.subText }]}>
            {formatDate(item.reported_on)}
          </Text>
        </View>

        {/* Main report details */}
        <View style={styles.mainDetails}>
          <View style={styles.typeContainer}>
            <View style={styles.typeIconContainer}>
              {getReportTypeIcon(item.report_type || 'game_issue')}
            </View>
            <View>
              <Text style={[styles.typeLabel, { color: colors.subText }]}>Report Type</Text>
              <Text style={[styles.typeValue, { color: colors.text }]}>
                {getReportTypeDisplayName(item.report_type || 'game_issue')}
              </Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusIconContainer}>
              {getStatusIcon(item.status || 'pending')}
            </View>
            <Text style={[styles.statusText, { color: colors[item.status || 'pending'] }]}>
              {capitalize(item.status || 'pending')}
            </Text>
          </View>
        </View>

        {/* Description - Only for game_issue type */}
        {item.report_type === 'game_issue' && item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionLabel, { color: colors.subText }]}>Description:</Text>
            <Text style={[styles.descriptionValue, { color: colors.text }]} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Evidence count - Only for game_issue type */}
        {item.report_type === 'game_issue' && (
          <View style={styles.evidenceContainer}>
            <AppIcon icon={Image01Icon} size={iconSize.sm} color={colors.subText} />
            <Text style={[styles.evidenceText, { color: colors.subText }]}>
              {[item.evidence_1, item.evidence_2, item.evidence_3].filter(Boolean).length} Evidence(s) Uploaded
            </Text>
          </View>
        )}

        {/* Admin notes if available */}
        {item.admin_notes && (
          <View style={[styles.notesContainer, { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : '#1a1a1a' }]}>
            <Text style={[styles.notesLabel, { color: colors.subText }]}>Admin Notes</Text>
            <Text style={[styles.notesValue, { color: colors.text }]}>{item.admin_notes}</Text>
          </View>
        )}

        {/* Resolved info if available */}
        {item.resolved_on && (
          <View style={styles.resolvedContainer}>
            <Text style={[styles.resolvedText, { color: colors.subText }]}>
              Resolved on {formatDate(item.resolved_on)}
            </Text>
          </View>
        )}

        <View style={[styles.bottomLine, { backgroundColor: colors.bottomLine }]} />
      </View>
    </View>
    );
  }, [colors, isLight]);

  const listEmptyComponent = useMemo(() => {
    if (isFetching && validReports.length === 0) {
      return null;
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <AppIcon icon={AlertCircleIcon} size={64} color={colors.destructive} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Failed to load reports</Text>
          <Text style={[styles.pullText, { color: colors.subText }]}>Pull down to retry</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <AppIcon icon={Flag01Icon} size={64} color={colors.subText} />
        <Text style={[styles.emptyText, { color: colors.text }]}>No reports submitted yet</Text>
        <Text style={[styles.pullText, { color: colors.subText }]}>Pull down to refresh</Text>
      </View>
    );
  }, [isFetching, validReports.length, isError, colors]);

  /**
   * Footer component showing loading indicator when fetching more
   */
  const listFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={isLight ? "#000000" : "#ffffff"} />
      </View>
    );
  }, [isFetchingNextPage, isLight]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />

      {/* Header */}
      <AppHeader
        backButton={true}
        title={'My Reports'}
      />
      
      <FlatList
        data={validReports}
        renderItem={renderReportCard}
        keyExtractor={(item, index) => item?.id?.toString() || `report-${index}`}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
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

      {/* Loading indicator for initial load */}
      <Loader visible={reportsLoading && validReports.length === 0} />
    </View>
  );
};

export default React.memo(ReportList);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reportCardContainer: {
    marginBottom: 12,
  },
  reportCard: {
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
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '500',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
