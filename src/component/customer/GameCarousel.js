import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { fontSize, spacing, radius } from '../../theme/typography';
import { getVisibleCarouselGames } from '../../utils/selectedGamesStorage';
import GameCarouselSkeleton from './skeleton/GameCarouselSkeleton';

const GameCarousel = ({ games, handleGameCardPress, isLoading = false }) => {
  const { isLight } = useThemeStore();
  const [visibleGames, setVisibleGames] = useState([]);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  const loadSelectedGames = useCallback(async () => {
    if (isLoading) {
      setVisibleGames([]);
      setIsCarouselReady(false);
      return;
    }

    if (!games?.length) {
      setVisibleGames([]);
      setIsCarouselReady(true);
      return;
    }

    const selected = await getVisibleCarouselGames(games);
    setVisibleGames(selected);
    setIsCarouselReady(true);
  }, [games, isLoading]);

  useEffect(() => {
    loadSelectedGames();
  }, [loadSelectedGames]);

  useFocusEffect(
    useCallback(() => {
      loadSelectedGames();
    }, [loadSelectedGames]),
  );

  if (isLoading || !isCarouselReady || !visibleGames.length) {
    return <GameCarouselSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isLight ? styles.titleLight : styles.titleDark]}>
          Create Match
        </Text>
      </View>

      <View style={styles.cardsRow}>
        {visibleGames.map((game) => (
          <Pressable
            key={game.game_id}
            style={[
              styles.gameCard,
              isLight ? styles.cardLight : styles.cardDark,
            ]}
            onPress={() => handleGameCardPress(game)}
          >
            <Image source={{ uri: game.game_logo_url }} style={styles.gameLogo} />
            <Text
              style={[styles.gameName, isLight ? styles.nameLight : styles.nameDark]}
              numberOfLines={2}
            >
              {game.game_name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default GameCarousel;

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  titleLight: { color: '#000000' },
  titleDark: { color: '#EAEAEA' },
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
  cardLight: { borderColor: '#1A1A1A' },
  cardDark: { borderColor: '#EAEAEA' },
  gameLogo: {
    width: '100%',
    aspectRatio: 1,
  },
  gameName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
    textAlign: 'center',
  },
  nameLight: { color: '#333333' },
  nameDark: { color: '#EAEAEA' },
});
