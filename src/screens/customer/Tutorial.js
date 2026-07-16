import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Video, { ResizeMode } from 'react-native-video'
import { useThemeStore } from '../../store/themeStore'
import AppHeader from './header/AppHeader'
import { fontSize, spacing, radius } from '../../theme/typography'

const TUTORIAL_DRIVE_FILE_ID = '1HQA-WuuCPX5hZhTezvbBMzzeySXS8pm0'

const getTutorialVideoUrl = (fileId) =>
  `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`

const Tutorial = () => {
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { isLight } = useThemeStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [paused, setPaused] = useState(true)

  useFocusEffect(
    useCallback(() => {
      setPaused(true)

      return () => setPaused(true)
    }, []),
  )

  const tutorialVideoUrl = useMemo(
    () => getTutorialVideoUrl(TUTORIAL_DRIVE_FILE_ID),
    [],
  )

  const colors = {
    background: isLight ? '#f5f5f5' : '#000000',
    cardBackground: '#000000',
    border: isLight ? '#000000' : '#ffffff',
    errorText: isLight ? '#b00020' : '#ff8a80',
  }

  const headerBlockHeight = 96
  const availableHeight = screenHeight - insets.top - insets.bottom - headerBlockHeight
  const cardWidth = screenWidth * 0.92
  const portraitHeight = (cardWidth * 16) / 9
  const cardHeight = Math.min(portraitHeight, availableHeight)

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <AppHeader backButton title="Watch Tutorial" />

        <View style={styles.playerSection}>
          <View
            style={[
              styles.videoCard,
              {
                width: cardWidth,
                height: cardHeight,
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            {isLoading && !hasError && (
              <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
            )}

            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorTitle, { color: '#ffffff' }]}>
                  Unable to play tutorial
                </Text>
                <Text style={[styles.errorText, { color: colors.errorText }]}>
                  Check that the Google Drive file is shared as &quot;Anyone with the link&quot;.
                </Text>
              </View>
            ) : (
              <Video
                source={{ uri: tutorialVideoUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                controls
                repeat
                paused={paused}
                onPlaybackRateChange={({ playbackRate }) => {
                  setPaused(playbackRate === 0)
                }}
                onLoad={() => {
                  setIsLoading(false)
                  setPaused(true)
                }}
                onReadyForDisplay={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setHasError(true)
                }}
              />
            )}
          </View>
        </View>
      </View>
    </>
  )
}

export default Tutorial

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  videoCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
})
