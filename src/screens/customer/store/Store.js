import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons, Ionicons, AntDesign, Octicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Carousel, { Pagination } from 'react-native-reanimated-carousel'
import { useSharedValue, useDerivedValue, interpolate, Extrapolation } from 'react-native-reanimated'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../../store/themeStore'
import { useAuthStore } from '../../../store/authStore'
import { scaleWidth, scaleHeight } from '../../../utils/scaling'
import { useBottomSheet } from '../../../context/BottomSheetContext'
import { useNavigation } from '@react-navigation/native'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { useGameAccounts } from '../../../queries/useGameAccounts'
import { queryClient } from '../../../lib/queryClient'
import ProductCardSkeleton from '../../../component/customer/store/ProductCardSkeleton'
import { useDeleteGameAccount } from '../../../queries/useMutation/useDeleteGameAccount'
import { usePurchaseGameAccount } from '../../../queries/useMutation/usePurchaseGameAccount'
import { useUtils } from '../../../queries/useUtils'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 20 // Full width card with minimal padding
const IMAGE_HEIGHT = (CARD_WIDTH * 736) / 1600 // Maintain 1600x736 aspect ratio

const getTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const ProductCard = ({ product, index, isLight, onOrderPress, onDeletePress, userEmail, isIOSActive }) => {
  const carouselRef = useRef(null)
  const progress = useSharedValue(0)
  const animatedProgress = useDerivedValue(() => progress.value)

  const isSold = product.status === 'sold'
  const isOwner = product.seller?.email === userEmail

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: 'transparent',
          borderColor: isLight ? '#1a1a1a' : '#ffffff',
        },
      ]}  
    >
      {/* Product Images Carousel */}
      <View style={styles.imageContainer}>
        <Carousel
          ref={carouselRef}
          width={CARD_WIDTH}
          height={IMAGE_HEIGHT}
          loop={true}
          pagingEnabled
          data={product.images}
          onProgressChange={(_, absoluteProgress) => {
            progress.value = absoluteProgress
          }}
          renderItem={({ item }) => (
            <View style={styles.imageSlide}>
              <Image
                source={typeof item === 'string' ? { uri: item } : item}
                style={styles.productImage}
              />
            </View>
          )}
        />

        {/* Pagination Dots */}
        <Pagination.Custom
          progress={animatedProgress}
          data={product.images}
          size={6}
          dotStyle={{
            borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
          activeDotStyle={{
            borderRadius: 5,
            width: 30,
            height: 6,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
          containerStyle={styles.paginationContainer}
          horizontal
          customReanimatedStyle={(progressValue, index, length) => {
            let val = Math.abs(progressValue - index)
            if (index === 0 && progressValue > length - 1) {
              val = Math.abs(progressValue - length)
            }

            return {
              transform: [
                {
                  translateY: interpolate(
                    val,
                    [0, 1],
                    [0, 0],
                    Extrapolation.CLAMP,
                  ),
                },
              ],
            }
          }}
        />

        {isSold && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Sold</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {isIOSActive && (
          <>
            {/* Seller Info + Game Pill Row */}
            <View style={styles.sellerContainer}>
              {product.seller && (
                <View style={styles.sellerLeft}>
                  <View style={[
                    styles.sellerAvatar,
                    { 
                      borderWidth: 2,
                      borderColor: isLight ? '#e0e0e0' : '#444444',
                      backgroundColor: isLight ? '#f5f5f5' : '#2a2a2a',
                    }
                  ]}>
                    {product.seller.profile_picture ? (
                      <Image
                        source={{ uri: product.seller.profile_picture }}
                        style={styles.sellerImage}
                      />
                    ) : (
                      <View style={[
                        styles.sellerFallback,
                        { backgroundColor: isLight ? '#e0e0e0' : '#333333' }
                      ]}>
                        <Octicons
                          name="feed-person"
                          size={20}
                          color={isLight ? '#000000' : '#ffffff'}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.sellerInfo}>
                    <Text
                      style={[
                        styles.sellerName,
                        { color: isLight ? '#1a1a1a' : '#ffffff' },
                      ]}
                      numberOfLines={1}
                    >
                      {product.seller.full_name}
                    </Text>
                    <Text
                      style={[
                        styles.sellerLabel,
                        { color: isLight ? '#666666' : '#999999' },
                      ]}
                    >
                      {product.created_at ? getTimeAgo(product.created_at) : 'Seller'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Game Info Pill */}
              <View style={styles.pillsRow}>
                <View style={[
                  styles.gamePill,
                  { 
                    backgroundColor: isLight ? '#ffffff' : '#1a1a1a',
                    borderColor: isLight ? '#e0e0e0' : '#333333',
                  }
                ]}>
                  <View style={[
                    styles.iconWrapper,
                    { backgroundColor: isLight ? '#A855F7' : 'rgba(168, 85, 247, 0.2)' },
                    isLight && {
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4.5,
                    }
                  ]}>
                    <Ionicons name="game-controller" size={12} color={isLight ? '#ffffff' : '#A855F7'} />
                  </View>
                  <Text style={[
                    styles.pillText,
                    { color: isLight ? '#333333' : '#ffffff' }
                  ]}>
                    {product.game}
                  </Text>
                </View>

                <View style={[
                  styles.gamePill,
                  { 
                    backgroundColor: isLight ? '#ffffff' : '#1a1a1a',
                    borderColor: isLight ? '#e0e0e0' : '#333333',
                  }
                ]}>
                  <View style={[
                    styles.iconWrapper,
                    { backgroundColor: isLight ? '#00bf63' : 'rgba(0, 191, 99, 0.2)' },
                    isLight && {
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4.5,
                    }
                  ]}>
                    <Ionicons name="checkmark" size={12} color={isLight ? '#ffffff' : '#00bf63'} />
                  </View>
                  <Text style={[
                    styles.pillText,
                    { color: isLight ? '#333333' : '#ffffff' }
                  ]}>
                    Verified
                  </Text>
                </View>
              </View>
            </View>

            {/* Chat Bubble Description */}
            <View style={styles.chatBubbleWrapper}>
              <View style={[
                styles.chatBubblePointer,
                { borderBottomColor: isLight ? '#e9ecef' : '#1e1e1e' },
              ]} />
              <View style={[
                styles.chatBubble,
                { backgroundColor: isLight ? '#e9ecef' : '#1e1e1e' },
              ]}>
                <Text
                  style={[
                    styles.productName,
                    { color: isLight ? '#000000' : '#d4d4d4' , fontWeight: '500' },
                  ]}
                >
                  {product.description}
                </Text>
              </View>
            </View>

            {/* Separator */}
            <View style={[styles.descriptionSeparator, { borderBottomColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }]} />
          </>
        )}

        {/* Buy / Delete Button */}
        {isOwner ? (
          <View style={styles.ownerRow}>
            <View style={styles.listedInfo}>

              <Text style={[styles.listedText, { color: isLight ? '#333333' : '#e0e0e0' }]}>
                Listed for {product.points.toLocaleString()} Points
              </Text>
            </View>
            <Pressable
              style={[
                styles.removeIconButton,
                { backgroundColor: isLight ? '#000000' : '#ffffff' },
              ]}
              onPress={() => onDeletePress(product)}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={isLight ? '#ffffff' : '#000000'}
              />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[
              styles.buyButton,
              { 
                backgroundColor: !isSold 
                  ? (isLight ? '#000000' : '#ffffff') 
                  : (isLight ? '#cccccc' : '#444444'),
              },
            ]}
            disabled={isSold}
            onPress={() => onOrderPress(product)}
          >
            {!isSold ? (
              <View style={styles.buyButtonContent}>

                <Text style={[
                  styles.buyButtonText,
                  { color: isLight ? '#ffffff' : '#000000' },
                ]}>
                Purchase for {product.points.toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.buyButtonText,
                { color: isLight ? '#666666' : '#999999' },
              ]}>
                Sold Out
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  )
}

const EmptyListComponent = ({ isLight }) => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons
      name="store-off"
      size={64}
      color={isLight ? '#cccccc' : '#444444'}
    />
    <Text style={[styles.emptyTitle, { color: isLight ? '#1a1a1a' : '#ffffff' }]}>
      No Products Available
    </Text>
    <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : '#999999' }]}>
      Check back later !
    </Text>
  </View>
)

const ProductHeader = ({ isLight, walletBalance, onWalletPress, isIOSActive }) => (
  <View style={styles.header}>
    <View>
      <Text style={[styles.headerTitle, { color: isLight ? '#000000' : '#ffffff' }]}>
        {isIOSActive ? 'Buy & Sell' : 'Product'}
      </Text>
      <View style={[styles.headingUnderline, { backgroundColor: isLight ? '#000000' : '#ffffff' }]} />
    </View>

    {isIOSActive && (
      <Pressable onPress={onWalletPress}>
        <View
          style={[
            styles.addIconContainer,
            {
              backgroundColor: 'transparent',
            },
          ]}
        >
          <AntDesign
            name="plus"
            size={scaleWidth(30)}
            color={isLight ? '#000000' : '#ffffff'}
          />
        </View>
      </Pressable>
    )}
  </View>
)

const SKELETON_DATA = Array(3).fill(null).map((_, i) => ({ id: `skeleton-${i}` }))

const Store = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const { showPurchaseSheet, showConfirmSheet } = useBottomSheet()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isConnected } = useNetworkStatus()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const { mutate: deleteAccount } = useDeleteGameAccount()
  const { mutate: purchaseAccount, isPending: isPurchasing } = usePurchaseGameAccount()
  const { data: utils = [] } = useUtils()
  const isIOSActive = !!utils?.is_ios_active

  const walletBalance = user?.wallet_balance ?? 0



  

  const {
    data: { flat: products = [], hasMore = false } = {},
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
    error,
  } = useGameAccounts(5)

 
  const handleWalletPress = useCallback(() => {
    navigation.navigate('createSell')
  }, [navigation])

  const handleOrderPress = useCallback((product) => {
    showPurchaseSheet({
      product,
      onConfirm: () => {
        purchaseAccount(product.id, {
          onSuccess: (data) => {
            refetch()
            navigation.navigate('gamePoints')
          },
          onError: (error) => {
            Toast.show(
              error?.message || 'Failed to purchase account.',
              Toast.SHORT
            )
          },
        })
      },
    })
  }, [showPurchaseSheet, purchaseAccount, refetch, navigation])

  const handleDeletePress = useCallback((product) => {
    showConfirmSheet({
      title: 'Remove Listing',
      message: 'Are you sure you want to remove this listing?',
      confirmText: 'Remove',
      isDestructive: true,
      onConfirm: () => {
        deleteAccount(product.id, {
          onSuccess: (data) => {
            refetch()
          },
          onError: (error) => {
            Toast.show(
              error?.response?.data?.message || 'Failed to remove listing',
              Toast.SHORT
            )
          },
        })
      },
    })
  }, [showConfirmSheet, deleteAccount, refetch])

  const handleRefresh = useCallback(async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT)
      return
    }
    setIsManualRefreshing(true)
    try {
      queryClient.removeQueries({ queryKey: ['gameAccounts', 5] })
      await refetch()
    } catch (err) {
      Toast.show('Failed to refresh. Please try again.', Toast.SHORT)
    } finally {
      setIsManualRefreshing(false)
    }
  }, [isConnected, refetch])

  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isFetchingNextPage) {
      try {
        await fetchNextPage()
      } catch (err) {
        console.error('Failed to load more:', err)
      }
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage])

  const renderProduct = useCallback(
    ({ item, index }) => (
      <ProductCard
        product={item}
        index={index}
        isLight={isLight}
        onOrderPress={handleOrderPress}
        onDeletePress={handleDeletePress}
        userEmail={user?.email}
        isIOSActive={isIOSActive}
      />
    ),
    [isLight, handleOrderPress, handleDeletePress, user?.email, isIOSActive]
  )

  const renderSkeleton = useCallback(() => (
    <ProductCardSkeleton isLight={isLight} />
  ), [isLight])

  const showSkeleton = isLoading || isManualRefreshing

  if (error && !products.length && !isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />
        <ProductHeader isLight={isLight} walletBalance={walletBalance} onWalletPress={handleWalletPress} isIOSActive={isIOSActive} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: isLight ? '#1a1a1a' : '#ffffff' }]}>No internet connection</Text>
          <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : '#999999' }]}>Please check your connection and try again</Text>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />

      <ProductHeader isLight={isLight} walletBalance={walletBalance} onWalletPress={handleWalletPress} isIOSActive={isIOSActive} />

      {/* Products Grid */}
      <View style={styles.listWrapper}>
        <FlashList
          data={showSkeleton ? SKELETON_DATA : products}
          renderItem={showSkeleton ? renderSkeleton : renderProduct}
          keyExtractor={(item, index) => showSkeleton ? `skeleton-${index}` : item.id.toString()}
          numColumns={1}
          estimatedItemSize={CARD_WIDTH + 200}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={!showSkeleton ? <EmptyListComponent isLight={isLight} /> : null}
          extraData={isLight}
          onEndReached={showSkeleton ? undefined : handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={isLight ? '#000000' : '#ffffff'}
              colors={[isLight ? '#000000' : '#ffffff']}
              progressBackgroundColor={isLight ? '#f0f0f0' : '#333333'}
              progressViewOffset={10}
              style={{ backgroundColor: 'transparent' }}
            />
          }
        />
      </View>
    </View>
  )
}

export default Store

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headingUnderline: {
    width: 80,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  addIconContainer: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadge: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(24),
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaleWidth(8),
  },
  walletText: {
    fontSize: scaleWidth(14),
    fontWeight: '700',
    color: '#000000',
    marginLeft: scaleWidth(6),
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderTopRightRadius: scaleWidth(25),
    borderTopLeftRadius: scaleWidth(25),
    borderBottomRightRadius: scaleWidth(25),
    borderBottomLeftRadius: scaleWidth(25),
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  sellerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sellerFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  sellerLabel: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  imageSlide: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  productImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    resizeMode: 'cover',
    backgroundColor: '#f8f8f8',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    gap: 4,
    alignItems: 'center',
    height: 6,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productInfo: {
    padding: 12,
  },
  chatBubbleWrapper: {
    marginBottom: 10,
    marginLeft: 8,
  },
  chatBubblePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: 12,
  },
  chatBubble: {
    borderRadius: 12,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  descriptionSeparator: {
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 12,
  },
  priceLine: {
    width: 20,
    height: 1,
    opacity: 0.8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00bf63',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00bf63',
  },
  buyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  listedText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  removeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  buyButtonPointsLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
