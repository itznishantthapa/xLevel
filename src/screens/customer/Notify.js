import React, { useMemo, useState, useCallback } from 'react'
import { StatusBar, StyleSheet, Text, View, Dimensions, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import Toast from "react-native-simple-toast"
import { useThemeStore } from '../../store/themeStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useInfiniteNotifications } from '../../queries/useNotifications'
import { queryClient } from '../../lib/queryClient'
import NotificationCard from '../../component/customer/NotificationCard'
import Loader from '../../component/Loader'
import AppHeader from './header/AppHeader'


const { width, height } = Dimensions.get('window')
const ITEM_HEIGHT = 200 // Approximate height of each notification card

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
    <AppHeader title={'Notifications'} />
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
            <View style={styles.listWrapper}>
                <FlashList
                    {...flashListProps}
                    data={isFetching && notifications.length === 0 ? [] : notifications}
                    renderItem={renderNotificationCard}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={<HeaderComponent />}
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
            <Loader visible={isFetching && notifications.length === 0} />
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
    }
});