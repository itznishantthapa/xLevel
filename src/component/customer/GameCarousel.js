import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { fontSize, spacing, radius } from '../../theme/typography';

const CARD_WIDTH = 88;
const CARD_HEIGHT = 112;

const GameCarousel = ({ games, handleGameCardPress }) => {
  const { isLight } = useThemeStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isLight ? styles.titleLight : styles.titleDark]}>
          Create Game
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 15}
        snapToAlignment="start"
      >
        {games?.map((game, index) => (
          <Pressable
            key={game.game_id}
            style={[
              styles.gameCard,
              { marginLeft: index === 0 ? spacing.xl : 0 },
              isLight ? styles.cardLight : styles.cardDark,
            ]}
            onPress={() => handleGameCardPress(game)}
          >
            <Image source={{ uri: game.game_logo_url }} style={styles.gameLogo} />
            <Text style={[styles.gameName, isLight ? styles.nameLight : styles.nameDark]}>
              {game.game_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
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
  scrollContainer: {
    paddingRight: spacing.xl,
  },
  gameCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 15,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cardLight: { borderColor: '#1A1A1A' },
  cardDark: { borderColor: '#EAEAEA' },
  gameLogo: {
    width: 88,
    height: 88,
  },
  gameName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  nameLight: { color: '#333333' },
  nameDark: { color: '#EAEAEA' },
});
