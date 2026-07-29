import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { fontSize, spacing, radius } from '../../../theme/typography';
import { MAX_CAROUSEL_GAMES } from '../../../constants/games';

const GameCarouselSkeleton = () => {
  const { isLight } = useThemeStore();
  const skeletonColor = isLight ? '#e8e8e8' : '#1a1a1a';
  const borderColor = isLight ? '#d4d4d4' : '#333333';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.titleBar, { backgroundColor: skeletonColor }]} />
      </View>

      <View style={styles.cardsRow}>
        {Array.from({ length: MAX_CAROUSEL_GAMES }).map((_, index) => (
          <View
            key={`game-carousel-skeleton-${index}`}
            style={[styles.gameCard, { borderColor }]}
          >
            <View style={[styles.gameLogo, { backgroundColor: skeletonColor }]} />
            <View style={[styles.gameName, { backgroundColor: skeletonColor }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default GameCarouselSkeleton;

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  titleBar: {
    width: 96,
    height: fontSize.md + 2,
    borderRadius: radius.sm,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  gameCard: {
    flex: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  gameLogo: {
    width: '100%',
    aspectRatio: 1,
  },
  gameName: {
    width: '70%',
    height: fontSize.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
});
