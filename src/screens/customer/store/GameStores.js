import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../../../components/common/AppIcon';
import { StoreIcon, UnavailableIcon, Diamond02Icon } from '@hugeicons/core-free-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useUtils } from '../../../queries/useUtils';
import { useGames } from '../../../queries/useGames';
import { storeHeroImages, STORE_THEMES } from '../../../assets/store';
import AppHeader from '../header/AppHeader';
import { fontSize, spacing, radius, iconSize } from '../../../theme/typography';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.md;
const CARD_ASPECT_RATIO = 1.12;
const HERO_WIDTH_RATIO = 1.1;
const HERO_HEIGHT_RATIO = 1.05;
const HERO_OVERFLOW_RATIO = 0.22;

const getStoreGridLayout = (windowWidth) => {
  const contentWidth = windowWidth - HORIZONTAL_PADDING * 2;
  const cardWidth = Math.floor((contentWidth - GRID_GAP) / 2);
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);
  const heroOverflow = Math.round(cardWidth * HERO_OVERFLOW_RATIO);
  const heroWidth = Math.round(cardWidth * HERO_WIDTH_RATIO);
  const heroHeight = Math.round(cardHeight * HERO_HEIGHT_RATIO);

  return {
    contentWidth,
    cardWidth,
    cardHeight,
    heroOverflow,
    heroWidth,
    heroHeight,
    rowGap: heroOverflow + spacing.lg,
  };
};

const STORE_CONFIG = [
  {
    id: 'freefire',
    match: ['free fire', 'freefire'],
    route: 'freeFireStore',
    flag: 'is_freefire_store_active',
    heroKey: 'freefire',
    ...STORE_THEMES.freefire,
  },
  {
    id: 'pubg',
    match: ['pubg'],
    route: 'pubgStore',
    flag: 'is_pubg_store_active',
    heroKey: 'pubg',
    ...STORE_THEMES.pubg,
  },
  {
    id: 'efootball',
    match: ['efootball'],
    route: 'efootballStore',
    flag: 'is_efootball_store_active',
    heroKey: 'efootball',
    ...STORE_THEMES.efootball,
  },
  {
    id: 'mlbb',
    match: ['mlbb'],
    route: 'mlbbStore',
    flag: 'is_mlbb_store_active',
    heroKey: 'mlbb',
    ...STORE_THEMES.mlbb,
  },
];

const getStoreConfig = (gameName = '') => {
  const name = gameName.toLowerCase();
  return STORE_CONFIG.find(({ match }) => match.some((token) => name.includes(token)));
};

const PromoBanner = ({ colors }) => (
  <LinearGradient
    colors={colors.promoGradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.promoBanner}
  >
    <View style={styles.promoTextBlock}>
      <Text style={styles.promoTitle}>Game Top-Up</Text>
      <Text style={styles.promoSubtitle}>
        Top up diamonds, UC, coins and more for your favourite games.
      </Text>
    </View>
    <View style={styles.promoIconWrap}>
      <AppIcon icon={Diamond02Icon} size={iconSize.xl} color="#FFFFFF" />
    </View>
  </LinearGradient>
);

const StoreOverflowCard = ({ game, config, layout, onPress, closed = false, colors }) => {
  const { cardWidth, cardHeight, heroWidth, heroHeight, heroOverflow } = layout;

  if (closed) {
    return (
      <View style={[styles.gridCell, styles.gridCellClosed, { width: cardWidth }]}>
        <View style={styles.closedCardPressable}>
          <View
            style={[
              styles.gameCard,
              styles.closedCard,
              {
                width: cardWidth,
                height: cardHeight,
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.closedIconWrap}>
              <AppIcon icon={UnavailableIcon} size={iconSize.xl + 6} color={colors.textTertiary} />
            </View>

            <View style={styles.logoBadge}>
              <Image
                source={{ uri: game.game_logo_url }}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.closedCardFooter}>
              <Text style={[styles.closedCardTitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {`${config.label} STORE CLOSED`}
              </Text>
              <Text style={[styles.closedCardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                {game.game_name}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.gridCell, { width: cardWidth }]}>
      <Pressable style={styles.cardPressable} onPress={onPress}>
        <Image
          source={storeHeroImages[config.heroKey]}
          style={[
            styles.heroImage,
            {
              width: heroWidth,
              height: heroHeight,
              top: -heroOverflow,
              left: (cardWidth - heroWidth) / 2,
            },
          ]}
          resizeMode="contain"
        />
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gameCard, { width: cardWidth, height: cardHeight }]}
        >
          <View style={styles.cardFooter}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {config.label}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {config.listSubtitle}
            </Text>
          </View>
          <View style={styles.logoBadge}>
            <Image
              source={{ uri: game.game_logo_url }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const GameStores = () => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const { data: utils = {} } = useUtils();
  const { data: games = [] } = useGames();

  const layout = useMemo(() => getStoreGridLayout(windowWidth), [windowWidth]);

  const storeFlags = utils?.active_store || {};

  const storeItems = useMemo(() => {
    return STORE_CONFIG.map((config) => {
      const game = games.find((item) => getStoreConfig(item.game_name)?.id === config.id);
      if (!game) return null;
      return {
        game,
        config,
        isActive: !!storeFlags[config.flag],
      };
    }).filter(Boolean);
  }, [games, storeFlags]);

  const handleStorePress = useCallback(
    (game, config) => {
      navigation.navigate(config.route, { game });
    },
    [navigation],
  );

  const colors = useMemo(
    () => ({
      background: isLight ? '#ffffff' : '#000000',
      cardBackground: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
      text: isLight ? '#000000' : '#ffffff',
      textSecondary: isLight ? '#666666' : '#999999',
      textTertiary: isLight ? '#999999' : '#666666',
      border: isLight ? '#eaeaea' : 'rgba(255, 255, 255, 0.2)',
      promoGradient: isLight ? ['#1F2937', '#111827'] : ['#1F2937', '#0A0A0A'],
    }),
    [isLight],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />

      <AppHeader title="Store" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      >
        <PromoBanner colors={colors} />

        {storeItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppIcon icon={StoreIcon} size={iconSize.xl + 30} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Stores Available
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Check back later for game top-ups and items.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select your game</Text>

            <View
              style={[
                styles.grid,
                {
                  width: layout.contentWidth,
                  rowGap: layout.rowGap,
                  paddingTop: layout.heroOverflow,
                },
              ]}
            >
              {storeItems.map(({ game, config, isActive }) => (
                <StoreOverflowCard
                  key={config.id}
                  game={game}
                  config={config}
                  layout={layout}
                  colors={colors}
                  closed={!isActive}
                  onPress={isActive ? () => handleStorePress(game, config) : undefined}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default GameStores;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  promoTextBlock: {
    flex: 1,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 4,
  },
  promoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'center',
    overflow: 'visible',
  },
  gridCell: {
    overflow: 'visible',
  },
  gridCellClosed: {
    overflow: 'hidden',
  },
  cardPressable: {
    overflow: 'visible',
  },
  closedCardPressable: {
    overflow: 'hidden',
  },
  closedCard: {
    justifyContent: 'flex-end',
    shadowOpacity: 0,
    elevation: 0,
  },
  closedIconWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedCardFooter: {
    zIndex: 3,
    paddingRight: 42,
  },
  closedCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  closedCardSubtitle: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: spacing.xxs,
  },
  gameCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  logoBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    zIndex: 3,
    paddingRight: 42,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: spacing.xxs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: spacing.xl,
  },
});
