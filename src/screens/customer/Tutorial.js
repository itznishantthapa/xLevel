import { useState } from 'react'
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Video, { ResizeMode } from 'react-native-video'
import { useThemeStore } from '../../store/themeStore'
import AppHeader from './header/AppHeader'
import { fontSize, spacing, radius } from '../../theme/typography'

const TUTORIAL_VIDEO_URL =
  'https://drive.google.com/uc?export=download&confirm=t&id=1HQA-WuuCPX5hZhTezvbBMzzeySXS8pm0'

const Tutorial = () => {
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { isLight } = useThemeStore()
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  const headerBlockHeight = 96
  const availableHeight = screenHeight - insets.top - insets.bottom - headerBlockHeight
  const cardWidth = screenWidth * 0.92
  const cardHeight = Math.min((cardWidth * 16) / 9, availableHeight)

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? 'dark-content' : 'light-content'} />
      <View
        style={[
          styles.container,
          {
            backgroundColor: isLight ? '#f5f5f5' : '#000000',
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
                borderColor: isLight ? '#000000' : '#ffffff',
              },
            ]}
          >
            {!isReady && !hasError && (
              <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
            )}

            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Unable to play tutorial</Text>
                <Text style={[styles.errorText, { color: isLight ? '#b00020' : '#ff8a80' }]}>
                  Check that the Google Drive file is shared as &quot;Anyone with the link&quot;.
                </Text>
              </View>
            ) : (
              <Video
                source={{ uri: TUTORIAL_VIDEO_URL }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                controls={isReady}
                repeat
                onLoad={() => setIsReady(true)}
                onReadyForDisplay={() => setIsReady(true)}
                onError={() => setHasError(true)}
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
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
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
    color: '#ffffff',
  },
  errorText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
})
