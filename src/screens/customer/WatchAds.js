import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads'

// Store and components
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { AdsAPI } from '../../api/adsApi'
import { CreateGameLayout } from '../../component/customer/createGame'
import { FadingText } from '../../component/customer/animation/FadingText'

// Use your actual ad unit ID
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3488447190245589/4867474712'

const WatchAds = () => {
  const { isLight } = useThemeStore()
  const { user, get_user, update_user_from_ads } = useAuthStore()

  // Local state
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adWatched, setAdWatched] = useState(false)
  const [rewarded, setRewarded] = useState(null)
  
  // Refs for cleanup
  const reloadTimeoutRef = useRef(null)
  const successTimeoutRef = useRef(null)

  // Colors for theming
  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    textTertiary: isLight ? "#666666" : "#999999",
    primary: "#00bf63",
    border: isLight ? "#eaeaea" : "rgba(255, 255, 255, 0.3)",
    success: "#00bf63",
    warning: "#FFD700",
  }

  // Cleanup function
  const cleanup = () => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current)
      reloadTimeoutRef.current = null
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = null
    }
  }

 useEffect(() => {
  const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  })

  setRewarded(rewardedAd)

  const unsubscribeLoaded = rewardedAd.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      setLoaded(true)
      setLoading(false)
    }
  )

  const unsubscribeEarned = rewardedAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    async (reward) => {

      setAdWatched(true)

      try {
        const payload = { amount: reward.amount, type: "coins" }
        const response = await AdsAPI.updateGamePoints(payload)
        if (response.wallet_balance !== undefined && response.ads_count !== undefined) {
          update_user_from_ads(response)
        }
      } catch (error) {
        if(__DEV__){
          console.error('Error updating game points:', error)
        }
        get_user().catch(() => {})
      }

      successTimeoutRef.current = setTimeout(() => setAdWatched(false), 3000)

      // since CLOSED is unavailable, reload ad here
      setLoaded(false)
      setLoading(true)
      rewardedAd.load()
    }
  )

  setLoading(true)
  rewardedAd.load()

  return () => {
    cleanup()
    unsubscribeLoaded()
    unsubscribeEarned()
  }
}, [get_user, update_user_from_ads])


  const loadNextAd = () => {
    if (rewarded) {
      setLoading(true)
      rewarded.load()
    }
  }

  const showAd = () => {
    if (loaded && rewarded && !loading) {
      rewarded.show()
      setLoaded(false)

      // Load next ad after 1 second interval
      reloadTimeoutRef.current = setTimeout(loadNextAd, 1000)
    }  
  }

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return cleanup
  }, [])

  const isButtonDisabled = !loaded || loading
  const buttonTitle = loading ? 'Loading Ad...' : loaded ? 'Watch Ad' : 'Ad Not Ready'

  const adsRemaining = Math.max(0, 250 - (user?.ads_count || 0))
  const progressPercentage = Math.min(((user?.ads_count || 0) / 250) * 100, 100)

  return (
    <CreateGameLayout
      title="Watch Ads"
      isLight={isLight}
      isLoading={false}
      onSubmit={isButtonDisabled ? () => { } : showAd}
      buttonTitle={buttonTitle}
      loaderMessage="Loading ad..."
    >
      <View style={styles.container}>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Game Points</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {typeof user?.wallet_balance === "number" ? user.wallet_balance.toFixed(2) : user?.wallet_balance || 0}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Access Code</Text>
              {user?.user_access_code ? (
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {user.user_access_code}
                </Text>
              ) : (
                <FadingText text="Locked" color={colors.textTertiary} />
              )}
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progress to Access Code</Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {user?.ads_count || 0}/250
            </Text>
          </View>

          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercentage}%`
                }
              ]}
            />
          </View>
          

          <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
            {adsRemaining === 0 ? 'Congratulations! Access code unlocked!' : `${adsRemaining} ads remaining`}
          </Text>
        </View>

        {/* Success Message - Separate from ad card */}
        {adWatched && (
          <View style={[styles.successCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>
              Points earned successfully!
            </Text>
          </View>
        )}

        {/* Main Ad Card - Fixed layout */}
        <View style={[styles.adCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.adContent}>
            <View style={styles.adHeader}>
              <MaterialIcons name="play-circle-filled" size={40} color={colors.primary} />
              <View style={styles.adTextContainer}>
                <Text style={[styles.adTitle, { color: colors.text }]}>
                  Earn Game Points
                </Text>
                <Text style={[styles.adDescription, { color: colors.textSecondary }]}>
                  Watch a short video ad to earn points for games and tournaments.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Access Code Unlock Info */}
        <View style={[styles.unlockCard, { backgroundColor: colors.cardBackground }]}>
          <MaterialIcons name="lock" size={24} color={colors.warning} />
          <View style={styles.unlockContent}>
            <Text style={[styles.unlockTitle, { color: colors.text }]}>
              Unlock Tournament Access
            </Text>
            <Text style={[styles.unlockDescription, { color: colors.textSecondary }]}>
              Complete 250 ads to receive a special access code for exclusive tournaments.
            </Text>
          </View>
        </View>

        {/* Quick Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
          <MaterialIcons name="info" size={18} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Rewards added instantly • Watch multiple times for more game points
            </Text>
          </View>
        </View>
      </View>
    </CreateGameLayout>
  )
}

export default WatchAds

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Progress Card
  progressCard: {
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  progressSubtext: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Success Card - Separate from ad card
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Main Ad Card - Fixed layout
  adCard: {
    padding: 16,
    borderRadius: 12,
  },
  adContent: {
    flex: 1,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  adTextContainer: {
    flex: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Unlock Card
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  unlockContent: {
    flex: 1,
  },
  unlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  unlockDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
  },
})