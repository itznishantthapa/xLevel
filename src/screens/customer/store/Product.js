import React, { useState, useCallback } from 'react'
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useThemeStore } from '../../../store/themeStore'
import { useAuthStore } from '../../../store/authStore'
import { scaleWidth, scaleHeight } from '../../../utils/scaling'
import { useBottomSheet } from '../../../context/BottomSheetContext'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2 // 2 columns with padding

// Mocked product data for easy backend integration
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Gaming Headphones Pro',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80',
    category: 'Audio',
    inStock: true,
  },
  {
    id: '2',
    name: 'Mechanical Keyboard RGB',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
    category: 'Peripherals',
    inStock: true,
  },
  {
    id: '3',
    name: 'Wireless Earbuds',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    category: 'Audio',
    inStock: true,
  },
  {
    id: '4',
    name: 'Gaming Mouse Pro',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&q=80',
    category: 'Peripherals',
    inStock: true,
  },
  {
    id: '5',
    name: 'RGB Mouse Pad XL',
    price: 800,
    image: 'https://images.unsplash.com/photo-1616627577385-5c0765ac1d7e?w=400&q=80',
    category: 'Accessories',
    inStock: false,
  },
  {
    id: '6',
    name: 'USB Gaming Mic',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
    category: 'Audio',
    inStock: true,
  },
  {
    id: '7',
    name: 'Gaming Controller',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&q=80',
    category: 'Controllers',
    inStock: true,
  },
  {
    id: '8',
    name: 'Webcam HD 1080p',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&q=80',
    category: 'Accessories',
    inStock: true,
  },
]

const ProductCard = ({ product, index, isLight, onOrderPress }) => {
  const AnimatedView = Animated.createAnimatedComponent(View)

  return (
    <AnimatedView
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={[
        styles.productCard,
        {
          backgroundColor: isLight ? 'transparent' : '#000000',
          borderColor: isLight ? '#1a1a1a' : '#ffffff',
        },
      ]}  
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {!product.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text
          style={[
            styles.productName,
            { color: isLight ? '#1a1a1a' : '#ffffff' },
          ]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryBadge,
              { 
                backgroundColor: isLight ? '#f5f5f5' : 'rgba(255, 255, 255, 0.15)',
                borderColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.3)',
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: isLight ? '#666666' : '#ffffff' },
              ]}
            >
              {product.category}
            </Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={[
          styles.priceSection,
          { 
            backgroundColor: isLight ? '#f8f9fa' : 'rgba(255, 255, 255, 0.08)',
            borderColor: isLight ? '#e5e5e5' : 'rgba(255, 255, 255, 0.15)',
          },
        ]}>
          <View style={styles.priceRow}>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={16}
              color="#00bf63"
            />
            <Text style={styles.priceText}>{product.price.toLocaleString()}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>

        {/* Buy Button */}
        <Pressable
          style={[
            styles.buyButton,
            { 
              backgroundColor: product.inStock 
                ? (isLight ? '#1a1a1a' : '#ffffff') 
                : '#888888',
            },
          ]}
          disabled={!product.inStock}
          onPress={() => onOrderPress(product)}
        >
          <Text style={[
            styles.buyButtonText,
            { color: isLight ? '#ffffff' : '#1a1a1a' },
          ]}>
            {product.inStock ? 'Order Now' : 'Unavailable'}
          </Text>
        </Pressable>
      </View>
    </AnimatedView>
  )
}

const EmptyListComponent = ({ isLight }) => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons
      name="store-off"
      size={64}
      color={isLight ? '#cccccc' : '#444444'}
    />
    <Text style={[styles.emptyTitle, { color: isLight ? '#333333' : '#ffffff' }]}>
      No Products Available
    </Text>
    <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.7)' }]}>
      Check back later for exciting gaming gear!
    </Text>
  </View>
)

const ProductHeader = ({ isLight, walletBalance }) => (
  <View style={styles.header}>
    <View>
      <Text style={[styles.headerTitle, { color: isLight ? '#000' : '#fff' }]}>
        Gaming Store
      </Text>
      <View style={[styles.headingUnderline, { backgroundColor: isLight ? '#000000' : '#ffffff' }]} />
    </View>

    <LinearGradient
      colors={['#ffffff', '#f8fbff', '#f0f8ff', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.walletBadge}
    >
      <View style={styles.walletContent}>
        <MaterialCommunityIcons
          name="star-four-points-outline"
          size={scaleWidth(16)}
          color="#00bf63"
        />
        <Text style={styles.walletText}>
          {typeof walletBalance === 'number' ? walletBalance.toFixed(2) : walletBalance}
        </Text>
      </View>
    </LinearGradient>
  </View>
)

const Product = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const { showConfirmSheet } = useBottomSheet()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [products, setProducts] = useState(MOCK_PRODUCTS)

  // Get wallet balance from user store (fallback to mock value)
  const walletBalance = user?.wallet_balance ?? 12500

  const handleOrderPress = useCallback((product) => {
    showConfirmSheet({
      title: "Order Confirmation",
      message: `Are you sure you want to order "${product.name}" for ${product.price} points?`,
      confirmText: "Order Now",
      cancelText: "Cancel",
      isDestructive: false,
      onConfirm: () => {
        // TODO: Replace with actual order API call
        console.log('Product ordered:', product.id)
        console.log('Product details:', product)
      },
    })
  }, [showConfirmSheet])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // TODO: Replace with actual API call
    // Simulating API refresh
    setTimeout(() => {
      setProducts(MOCK_PRODUCTS)
      setRefreshing(false)
    }, 1000)
  }, [])

  const renderProduct = useCallback(
    ({ item, index }) => (
      <ProductCard product={item} index={index} isLight={isLight} onOrderPress={handleOrderPress} />
    ),
    [isLight, handleOrderPress]
  )

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

      <ProductHeader isLight={isLight} walletBalance={walletBalance} />

      {/* Products Grid */}
      <View style={styles.listWrapper}>
        <FlashList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          estimatedItemSize={280}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<EmptyListComponent isLight={isLight} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isLight ? '#000000' : '#ffffff'}
              colors={['#00bf63']}
            />
          }
        />
      </View>
    </View>
  )
}

export default Product

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
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(20),
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  walletText: {
    fontSize: scaleWidth(14),
    fontWeight: '700',
    color: '#1a1a1a',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 6,
    borderRadius: scaleWidth(20),
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
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
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceSection: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00bf63',
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00bf63',
    marginLeft: 2,
  },
  buyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
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
