import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  ImageBackground,
  Platform,
  RefreshControl
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeStore } from "../../store/themeStore"
import { useAuthStore } from "../../store/authStore"
import { Octicons, MaterialIcons, AntDesign, Entypo } from "@expo/vector-icons"
import AppHeader from "./header/AppHeader"
import CreatorInfo from "../../component/matchcard/CreatorInfo"
import { useEnhancements } from "../../queries/useEnhancer"
import { useEffect, useState } from "react"
import { useBottomSheet } from "../../context/BottomSheetContext"
import { useQueryClient } from "@tanstack/react-query"
import * as LocalAuthentication from "expo-local-authentication"
import Toast from "react-native-simple-toast"
import { useNavigation } from "@react-navigation/native"
import Loader from "../../component/Loader"
import { EnhancerAPI } from "../../api/enhancerApi"
import Animated, { 
  FadeIn,
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withTiming
} from 'react-native-reanimated'

const Exchange = () => {
  const { isLight } = useThemeStore()
  const { user, get_user } = useAuthStore()
  const { data: enhancers = [], isLoading: isQueryLoading, isError, error, refetch, isFetching } = useEnhancements()
  const { showConfirmSheet } = useBottomSheet()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)


 

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      Toast.show('Failed to refresh data.')
    } finally {
      setIsRefreshing(false)
    }
  }

  //  LOG  Enhancements: [{"discount": 0, "id": 1, "price": 400, "type": "pro_tag"}]

  const colors = {
    background: isLight ? "#eef0f2" : "#000000",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    textTertiary: isLight ? "#666666" : "#999999",
    border: isLight ? "#eaeaea" : "rgba(255, 255, 255, 0.3)",
    success: "#00bf63",
    warning: "#ff9500",
    premium: "#6366f1",
  }

  // Enhancement metadata mapping
  const enhancementMetadata = {
    pro_tag: {
      title: "Pro Tag",
      description: "Show your professional gaming status with the exclusive 'Pro' tag",
      color: colors.premium,
      enhancementKey: 'have_pro_tag'
    },
    hacker_tag: {
      title: "Hacker Tag",
      description: "Stand out with the exclusive 'Hckr' tag below your profile",
      color: colors.warning,
      enhancementKey: 'have_hacker_tag'
    },
    exposer: {
      title: "Profile Exposure",
      description: "Get featured with your profile picture as background in matches",
      color: colors.success,
      enhancementKey: 'have_exposer'
    }
  }


  // Mock game data for CreatorInfo preview - simplified without extra stats
  const mockGame = {
    game: {
      name: "Other", // Using "Other" to avoid showing extra game stats
      game_mode: "Standard"
    },
    is_free: true, // Set to true to avoid showing entry fee
    entry_fee: 0
  }

  // Create mock user data for different enhancement previews - minimal data
  const createMockUserData = (enhancements = {}) => ({
    ...user,
    full_name: user?.full_name || "Your Name",
    profile_picture: user?.profile_picture || null,
    // Override both ownership (have_*) and active status (active_*) for previews
    have_exposer: enhancements.have_exposer || false,
    have_pro_tag: enhancements.have_pro_tag || false,
    have_hacker_tag: enhancements.have_hacker_tag || false,
    // Set active status to match the preview intent (active when showing enhancement effect)
    active_exposer: enhancements.have_exposer || false,
    active_pro_tag: enhancements.have_pro_tag || false,
    active_hacker_tag: enhancements.have_hacker_tag || false,
  })

 const handleExchange = async (enhancementType, enhancementId, enhancementTitle, enhancementPrice) => {
  showConfirmSheet({
    title: "Confirm Exchange",
    message: `Exchange ${enhancementPrice} points for ${enhancementTitle}?`,
    confirmText: "Exchange",
    cancelText: "Cancel",
    isDestructive: true,
    onConfirm: async () => {

      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      let canProceed = false

      if (hasHardware && isEnrolled) {
        // Try biometric authentication
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Verify your identity",
          fallbackLabel: "Use Passcode",
        })
        canProceed = result.success
      } else {
        // No biometric or lock setup, skip auth
        canProceed = true
      }

      if (canProceed) {
        const payload = {
          enhancement_id: enhancementId,
          enhancement_type: enhancementType,
          price: enhancementPrice,
        }

        setIsLoading(true)
        try {
          const response = await EnhancerAPI.exchangeEnhancements(payload)
          await new Promise(resolve => setTimeout(resolve, 3000))

          if (response.status === 200) {
            navigation.navigate('thanks', {
              type: 'exchange',
              enhancementTitle,
              enhancementPrice,
              enhancementType
            })
            await get_user()
          }
        } catch (error) {
          Toast.show(error?.message || 'Exchange failed. Please try again.')
        } finally {
          setIsLoading(false)
        }
      } 
    },
  })
}


  
  const SkeletonCard = ({ index }) => (
    <Animated.View 
      entering={FadeIn.delay(index * 50).duration(400)}
      style={[styles.productCard, {
        backgroundColor: isLight ? "#eef0f2" : "#000000",
        borderColor: isLight ? "#333333" : "#ffffff"
      }]}
    >
      {/* Header Skeleton */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <View style={[styles.skeletonTitle, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
          <View style={[styles.skeletonBadge, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
        </View>
        <View style={[styles.skeletonDescription, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
        <View style={[styles.skeletonDescriptionShort, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
        <View style={styles.priceSection}>
          <View style={[styles.skeletonPrice, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
        </View>
      </View>
      
      {/* Preview Skeleton */}
      <View style={[styles.previewSection, {
        backgroundColor: isLight ? "#f8f9fa" : "transparent",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: isLight ? "#e5e5e5" : "#333333"
      }]}>
        <View style={styles.previewContainer}>
          <View style={styles.previewColumn}>
            <View style={[styles.skeletonPreviewLabel, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
            <View style={[styles.skeletonPreview, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
          </View>
          <View style={styles.previewColumn}>
            <View style={[styles.skeletonPreviewLabel, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
            <View style={[styles.skeletonPreview, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
          </View>
        </View>
      </View>
      
      {/* Button Skeleton */}
      <View style={[styles.skeletonButton, { backgroundColor: isLight ? "#f0f0f0" : "#2a2a2a" }]} />
    </Animated.View>
  )

  // Retry Component for when data fails to load
  const RetryComponent = () => (
    <Animated.View 
      entering={FadeIn.duration(800)}
      style={[styles.retryContainer, { backgroundColor: colors.cardBackground }]}
    >
      <AntDesign name="exclamationcircle" size={24} color={colors.textTertiary} />
      <Text style={[styles.retryTitle, { color: colors.text }]}>Failed to load enhancements</Text>
      <Text style={[styles.retryDescription, { color: colors.textTertiary }]}>Check your connection and try again</Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: isLight ? "#000000" : "#ffffff" }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: isLight ? "#ffffff" : "#000000" }]}>Retry</Text>
      </Pressable>
    </Animated.View>
  )

  const ExchangeProductCard = ({ title, price, originalPrice, discount, description, currentUser, enhancedUser, owned, onExchange, color, enhancementId, index }) => (
    <Animated.View 
      entering={FadeIn.delay(index * 150).duration(800)}
      style={[styles.productCard, {
        backgroundColor: isLight ? "#eef0f2" : "#000000",
        borderColor: isLight ? "#333333" : "#ffffff"
      }]}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {owned && (
            <View style={[styles.statusBadge, {
              backgroundColor: isLight ? "#000000" : "#ffffff"
            }]}>
              <Entypo name="check" size={16} color={isLight ? "#ffffff" : "#000000"} />
              <Text style={[styles.statusText, {
                color: isLight ? "#ffffff" : "#000000"
              }]}>Owned</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.currentPrice, { color: color }]}>
              {price} Points
            </Text>
            {discount > 0 && (
              <View style={styles.discountContainer}>
                <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                  {originalPrice} Points
                </Text>
                <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Preview Section */}
      <View style={[styles.previewSection, {
        backgroundColor: isLight ? "#f8f9fa" : "transparent",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: isLight ? "#e5e5e5" : "#333333"
      }]}>
        <View style={styles.previewContainer}>
          {/* Current State */}
          <View style={styles.previewColumn}>
            <Text style={[styles.previewLabel, { color: colors.textTertiary }]}>Without {title}</Text>
            <View style={[styles.previewWrapper, { backgroundColor: colors.background }]}>
              <CreatorInfo
                game={{ ...mockGame, created_by: currentUser }}
                isLight={isLight}
                isCreator={false}
                user={user}
              />
            </View>
          </View>

          {/* Enhanced State */}
          <View style={styles.previewColumn}>
            <Text style={[styles.previewLabel, { color: colors.textTertiary }]}>With {title}</Text>
            <View style={[styles.previewWrapper, { backgroundColor: colors.background }]}>
              <CreatorInfo
                game={{ ...mockGame, created_by: enhancedUser }}
                isLight={isLight}
                isCreator={false}
                user={user}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Small note for Profile Exposure when no profile picture */}
      {title === "Profile Exposure" && !user?.profile_picture && (
        <View style={styles.noteSection}>
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
           " Set a profile picture to see the exposure effect "
          </Text>
        </View>
      )}

      {/* Exchange Button */}
      <Pressable
        style={[
          styles.exchangeButton,
          isLight ? styles.exchangeButtonLight : styles.exchangeButtonDark,
          owned && { opacity: 0.6 }
        ]}
        onPress={() => !owned && onExchange()}
        disabled={owned}
      >
        <Text style={[styles.exchangeButtonText, { color: isLight ? "#ffffff" : "#000000" }]}>
          {owned ? 'Owned' : 'Exchange'}
        </Text>
      </Pressable>
    </Animated.View>
  )

  return (
    <>
      <Loader visible={isLoading} message="Processing exchange..." size={50} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />

        <SafeAreaView style={styles.container}>
          <AppHeader backButton={true} title={'Enhancements'} />

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={handleRefresh}
                colors={[isLight ? "#000000" : "#000000"]}
                tintColor={isLight ? "#000000" : "#ffffff"}
              />
            }
          >

            {/* Exchange Products */}
            <View style={styles.productsSection}>
              {isError ? (
                <RetryComponent />
              ) : (isQueryLoading && enhancers.length === 0) || isFetching ? (
                // Show skeleton cards while loading
                [0, 1, 2].map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} index={index} />
                ))
              ) : enhancers.length > 0 ? (
                enhancers.map((enhancement, index) => {
                  const metadata = enhancementMetadata[enhancement.type]
                  if (!metadata) return null

                  const originalPrice = enhancement.discount > 0
                    ? Math.round(enhancement.price / (1 - enhancement.discount / 100))
                    : enhancement.price

                  const isOwned = user?.enhancer?.[metadata.enhancementKey]

                  return (
                    <ExchangeProductCard
                      key={enhancement.id}
                      index={index}
                      title={metadata.title}
                      price={enhancement.price}
                      originalPrice={originalPrice}
                      discount={enhancement.discount}
                      description={metadata.description}
                      currentUser={createMockUserData({ [metadata.enhancementKey]: false })}
                      enhancedUser={createMockUserData({ [metadata.enhancementKey]: true })}
                      owned={isOwned}
                      onExchange={() => handleExchange(enhancement.type, enhancement.id, metadata.title, enhancement.price)}
                      color={metadata.color}
                      enhancementId={enhancement.id}
                    />
                  )
                })
              ) : (
                <Animated.View 
                  entering={FadeIn.duration(800)}
                  style={styles.noDataContainer}
                >
                  <AntDesign name="shoppingcart" size={32} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                  <Text style={[styles.noDataText, { color: colors.textTertiary }]}>
                    No enhancements available
                  </Text>
                  <Text style={[styles.noDataSubText, { color: colors.textTertiary }]}>
                    Pull down to refresh
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Info Section */}
            <Animated.View 
              entering={FadeIn.delay(enhancers.length * 150 + 200).duration(800)}
              style={[styles.infoSection, { backgroundColor: colors.cardBackground }]}
            >
              <AntDesign name="infocirlce" size={16} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.textTertiary }]}>
            "Enhancements are permanent. You can turn them on or off in your profile once your exchange is complete, and they will be displayed across all your game profiles."
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  )
}

export default Exchange

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 24,
  },

  // Header Section
  headerSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },

  // Products Section
  productsSection: {
    gap: 20,
  },
  productCard: {
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  // Header Section
  headerSection: {
    padding: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 2,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  // Price Section
  priceSection: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // No Data
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  noDataSubText: {
    fontSize: 12,
    textAlign: "center",
  },

  // Retry Component
  retryContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 16,
    gap: 8,
  },
  retryTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryDescription: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Preview Section
  previewSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  previewColumn: {
    flex: 1,
    gap: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: 'center',
  },
  previewWrapper: {
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    overflow: 'hidden',
  },

  // Note Section
  noteSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Exchange Button
  exchangeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  exchangeButtonLight: {
    backgroundColor: "#1a1a1a",
  },
  exchangeButtonDark: {
    backgroundColor: "#eaf4f4",
  },
  exchangeButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // Info Section
  infoSection: {
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // Skeleton Styles
  skeletonTitle: {
    height: 16,
    width: '60%',
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 20,
    width: 60,
    borderRadius: 8,
  },
  skeletonDescription: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginTop: 8,
  },
  skeletonDescriptionShort: {
    height: 12,
    width: '70%',
    borderRadius: 4,
    marginTop: 4,
  },
  skeletonPrice: {
    height: 16,
    width: 100,
    borderRadius: 4,
  },
  skeletonPreviewLabel: {
    height: 12,
    width: '80%',
    borderRadius: 4,
    alignSelf: 'center',
  },
  skeletonPreview: {
    height: 80,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
  },
  skeletonButton: {
    height: 40,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
})
