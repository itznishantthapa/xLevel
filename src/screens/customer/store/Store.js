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
  Linking,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-simple-toast'
import Carousel, { Pagination } from 'react-native-reanimated-carousel'
import { useSharedValue, useDerivedValue, interpolate, Extrapolation } from 'react-native-reanimated'
import { AppIcon } from '../../../components/common/AppIcon'
import {
  User02Icon,
  GameController01Icon,
  WhatsappIcon,
  Delete01Icon,
  PlusSignIcon,
  StoreRemove01Icon,
} from '@hugeicons/core-free-icons'
import { fontSize, spacing, radius, iconSize } from '../../../theme/typography'
import { useBottomSheet } from '../../../context/BottomSheetContext'
import { useNavigation } from '@react-navigation/native'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { useGameAccounts } from '../../../queries/useGameAccounts'
import { queryClient } from '../../../lib/queryClient'
import ProductCardSkeleton from '../../../component/customer/store/ProductCardSkeleton'
import AppHeader from '../header/AppHeader'
import { useDeleteGameAccount } from '../../../queries/useMutation/useDeleteGameAccount'
import { usePurchaseGameAccount } from '../../../queries/useMutation/usePurchaseGameAccount'
import { useThemeStore } from '../../../store/themeStore'
import { useAuthStore } from '../../../store/authStore'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.xl // Full width card with minimal padding
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

const handleOpenWhatsApp = async (sellerPhone) => {
  try {

    
    if (!sellerPhone) {
      Toast.show('Seller contact number not available', Toast.SHORT)
      console.log('No seller phone available')
      return
    }
    
    const whatsappUrl = `https://wa.me/977${sellerPhone}`

    
    Toast.show('Opening WhatsApp...', Toast.SHORT)
    await Linking.openURL(whatsappUrl)
  } catch (error) {
    console.log('Error opening WhatsApp:', error)
    Toast.show('Please install WhatsApp', Toast.SHORT)
  }
}

const ProductCard = ({ product, index, isLight, onOrderPress, onDeletePress, userEmail }) => {
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
          size={5}
          dotStyle={{
            borderRadius: 2.5,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            width: 5,
            height: 5,
          }}
          activeDotStyle={{
            borderRadius: 2.5,
            width: 5,
            height: 5,
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
                        <AppIcon
                          icon={User02Icon}
                          size={iconSize.md}
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
                      backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 0,
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
                    <AppIcon icon={GameController01Icon} size={iconSize.xs - 2} color={isLight ? '#ffffff' : '#A855F7'} />
                  </View>
                  <Text style={[
                    styles.pillText,
                    { color: isLight ? '#333333' : '#ffffff' }
                  ]}>
                    {product.game}
                  </Text>
                </View>

                <Pressable 
                  onPress={() => handleOpenWhatsApp(product.seller?.contact_number)}
                  style={[
                    styles.gamePill,
                    { 
                      backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 0,
                    }
                  ]}>
                  <View style={[
                    styles.iconWrapper,
                    { backgroundColor: '#25D366' },
                    isLight && {
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4.5,
                    }
                  ]}>
                    <AppIcon icon={WhatsappIcon} size={iconSize.xs - 2} color="#ffffff" />
                  </View>
                  <Text style={[
                    styles.pillText,
                    { color: isLight ? '#333333' : '#ffffff' }
                  ]}>
                    Chat
                  </Text>
                </Pressable>
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
              <AppIcon
                icon={Delete01Icon}
                size={iconSize.sm + 2}
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
    <AppIcon icon={StoreRemove01Icon} size={64} color={isLight ? '#cccccc' : '#444444'} />
    <Text style={[styles.emptyTitle, { color: isLight ? '#1a1a1a' : '#ffffff' }]}>
      No Products Available
    </Text>
    <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : '#999999' }]}>
      Check back later !
    </Text>
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

  const headerRightAction = (
    <Pressable
      onPress={handleWalletPress}
      style={styles.addIconButton}
      accessibilityRole="button"
      accessibilityLabel="Create listing"
    >
      <AppIcon
        icon={PlusSignIcon}
        size={iconSize.xl}
        color={isLight ? '#000000' : '#ffffff'}
      />
    </Pressable>
  )

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
      />
    ),
    [isLight, handleOrderPress, handleDeletePress, user?.email]
  )

  const renderSkeleton = useCallback(() => (
    <ProductCardSkeleton isLight={isLight} />
  ), [isLight])

  const showSkeleton = isLoading || isManualRefreshing

  if (error && !products.length && !isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />
        <AppHeader title="Buy & Sell" rightAction={headerRightAction} />
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

      <AppHeader title="Buy & Sell" rightAction={headerRightAction} />

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
  addIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadge: {
    paddingHorizontal: fontSize.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  walletText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#000000',
    marginLeft: spacing.xs + 2,
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: spacing.lg,
    borderTopRightRadius: radius.pill - 7,
    borderTopLeftRadius: radius.pill - 7,
    borderBottomRightRadius: radius.pill - 7,
    borderBottomLeftRadius: radius.pill - 7,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
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
    marginRight: spacing.sm + 2,
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
    fontSize: fontSize.sm + 1,
    fontWeight: '600',
    marginBottom: spacing.xxs,
    letterSpacing: 0.1,
  },
  sellerLabel: {
    fontSize: fontSize.xs,
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
    bottom: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productInfo: {
    padding: spacing.md,
  },
  chatBubbleWrapper: {
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.sm,
  },
  chatBubblePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: spacing.xs + 2,
    borderRightWidth: spacing.xs + 2,
    borderBottomWidth: spacing.xs + 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: spacing.md,
  },
  chatBubble: {
    borderRadius: radius.md,
    borderTopLeftRadius: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  productName: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    lineHeight: spacing.lg,
    letterSpacing: 0.2,
  },
  descriptionSeparator: {
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs + 2,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: fontSize.xs + 1,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs + 3,
    marginBottom: spacing.md,
  },
  priceLine: {
    width: spacing.xl,
    height: 1,
    opacity: 0.8,
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#00bf63',
  },
  pointsLabel: {
    fontSize: fontSize.xs + 1,
    fontWeight: '600',
    color: '#00bf63',
  },
  buyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 3,
  },
  buyButtonText: {
    fontSize: fontSize.base,
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
    gap: spacing.xs + 2,
    flex: 1,
  },
  listedText: {
    fontSize: fontSize.sm + 1,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  removeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  buyButtonPointsLabel: {
    fontSize: fontSize.xs + 1,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
