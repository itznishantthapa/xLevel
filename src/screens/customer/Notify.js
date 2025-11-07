import React, { useMemo, useState, useCallback } from 'react'
import { StatusBar, StyleSheet, Text, View, Dimensions, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import Toast from "react-native-simple-toast"
import Animated, { FadeIn } from 'react-native-reanimated'
import { useThemeStore } from '../../store/themeStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useInfiniteNotifications } from '../../queries/useNotifications'
import { queryClient } from '../../lib/queryClient'
import NotificationCard from '../../component/customer/NotificationCard'
import Loader from '../../component/Loader'
import AppHeader from './header/AppHeader'


const { width, height } = Dimensions.get('window')
const ITEM_HEIGHT = 200 // Approximate height of each notification card

const NotificationCardSkeleton = ({ index, isLight }) => (
    <Animated.View 
        entering={FadeIn.delay(index * 100).duration(600)}
        style={[styles.skeletonCard, {
            backgroundColor: isLight ? '#ffffff' : '#000000',
            borderColor: isLight ? '#333333' : '#dadada',
        }]}
    >
        {/* Header Section */}
        <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonIcon, { backgroundColor: isLight ? '#f0f0f0' : '#2a2a2a' }]} />
            <View style={styles.skeletonHeaderContent}>
                <View style={[styles.skeletonTitle, { backgroundColor: isLight ? '#f0f0f0' : '#2a2a2a' }]} />
                <View style={[styles.skeletonTime, { backgroundColor: isLight ? '#f0f0f0' : '#2a2a2a' }]} />
            </View>
        </View>

        {/* Message Section */}
        <View style={styles.skeletonMessageContainer}>
            <View style={[styles.skeletonMessage, { backgroundColor: isLight ? '#f0f0f0' : '#2a2a2a' }]} />
            <View style={[styles.skeletonMessageShort, { backgroundColor: isLight ? '#f0f0f0' : '#2a2a2a' }]} />
        </View>

        {/* Room Details Section (for some cards) */}
        {index % 3 === 0 && (
            <View style={styles.skeletonRoomContainer}>
                <View style={[styles.skeletonRoomItem, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]} />
                <View style={[styles.skeletonRoomItem, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]} />
                <View style={[styles.skeletonRoomItem, { backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)' }]} />
            </View>
        )}

        {/* Bottom Line */}
        <View style={[styles.skeletonBottomLine, { backgroundColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)' }]} />
    </Animated.View>
)

const EmptyListComponent = ({ isLight }) => (
    <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
            No Notifications
        </Text>
        <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)' }]}>
            You'll see notifications here when you receive game invites or other updates
        </Text>
    </View>
)

const HeaderComponent = () => (
    <AppHeader title={'Notify & Alert'} />
)

const getItemType = (item) => {
    return item.notification_type === 'game' ? 'game' : 'normal'
}

const Notify = () => {
    const { isLight } = useThemeStore()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, refetch, } = useInfiniteNotifications(10)

    const insets = useSafeAreaInsets();
    const { isConnected } = useNetworkStatus();

    const notifications = data?.pages?.flatMap(p => p?.notifications ?? []) ?? []

    const handleLoadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            try {
                await fetchNextPage()
            } catch (error) {
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const handleRefresh = useCallback(async () => {
        if (!isConnected) {
            Toast.show("No internet connection.", Toast.SHORT)
            return
        }

        setIsRefreshing(true)
        try {

            queryClient.removeQueries({ queryKey: ["notifications", 10] });
            await refetch();
        } catch (error) {
            if (__DEV__) {
                console.log('Failed to refresh notifications:', error)
            }
        } finally {
            // Always ensure refreshing state is reset
            setIsRefreshing(false)
        }
    }, [isConnected, refetch])

    // Memoize the render item function
    const renderNotificationCard = useMemo(() => (
        ({ item }) => <NotificationCard notification={item} />
    ), [])

    // Memoize the layout override function
    const overrideItemLayout = useMemo(() => (
        (layout, item) => {
            const type = getItemType(item)
            layout.size = type === 'game' ? ITEM_HEIGHT : ITEM_HEIGHT - 40
        }
    ), [])

    // Memoize FlashList props
    const flashListProps = useMemo(() => ({
        estimatedItemSize: ITEM_HEIGHT,
        estimatedListSize: { height, width },
        initialNumToRender: 10,
        drawDistance: ITEM_HEIGHT * 2,
        overrideItemLayout,
        showsVerticalScrollIndicator: false,
        contentContainerStyle: styles.listContainer,
        onEndReached: handleLoadMore,
        onEndReachedThreshold: 0,
    }), [overrideItemLayout, handleLoadMore])

    return (
        <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top }]}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={isLight ? "dark-content" : "light-content"}
            />
            <HeaderComponent />
            <View style={styles.listWrapper}>
                <FlashList
                    {...flashListProps}
                    data={isFetching && notifications.length === 0 ? Array(5).fill(null).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true })) : notifications}
                    renderItem={({ item, index }) => 
                        item.isSkeleton ? (
                            <NotificationCardSkeleton index={index} isLight={isLight} />
                        ) : (
                            <NotificationCard notification={item} />
                        )
                    }
                    keyExtractor={(item, index) => item.isSkeleton ? item.id : `notification-${item.id}-${index}`}
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
            {/* Remove the Loader component as we're using skeleton cards now */}
            {isFetchingNextPage && (
                <ActivityIndicator
                    style={styles.loadingIndicator}
                    size="small"
                    color={isLight ? '#333333' : '#ffffff'}
                />
            )}
        </View>
    )
}

export default React.memo(Notify)

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
        paddingBottom: 40,
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
    loadingIndicator: {
        marginTop: 10
    },
    // Skeleton Styles
    skeletonCard: {
        marginHorizontal: 10,
        marginVertical: 8,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    skeletonIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    skeletonHeaderContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skeletonTitle: {
        height: 14,
        width: 120,
        borderRadius: 4,
    },
    skeletonTime: {
        height: 12,
        width: 60,
        borderRadius: 4,
    },
    skeletonMessageContainer: {
        marginBottom: 12,
    },
    skeletonMessage: {
        height: 14,
        width: '100%',
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonMessageShort: {
        height: 14,
        width: '75%',
        borderRadius: 4,
    },
    skeletonRoomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    skeletonRoomItem: {
        flex: 1,
        height: 32,
        borderRadius: 8,
    },
    skeletonBottomLine: {
        width: '100%',
        height: 1,
        marginVertical: 12,
    },
});