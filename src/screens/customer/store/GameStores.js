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
import { StoreIcon, UnavailableIcon, Diamond02Icon, GameboyIcon } from '@hugeicons/core-free-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useUtils } from '../../../queries/useUtils';
import { useGames } from '../../../queries/useGames';
import { storeHeroImages, STORE_THEMES } from '../../../assets/store';
import AppHeader from '../header/AppHeader';
import { fontSize, spacing, radius, iconSize } from '../../../theme/typography';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.md;
const CARD_ASPECT_RATIO = 1.18;

const getStoreGridLayout = (windowWidth) => {
  const contentWidth = windowWidth - HORIZONTAL_PADDING * 2;
  const cardWidth = Math.floor((contentWidth - GRID_GAP) / 2);
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);

  return { contentWidth, cardWidth, cardHeight };
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

const SectionHeader = ({ colors }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionAccent, { backgroundColor: colors.sectionAccent }]} />
    <View style={styles.sectionHeaderContent}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.sectionIconBg }]}>
          <AppIcon icon={GameboyIcon} size={iconSize.md} color={colors.sectionIcon} />
        </View>
        <View style={styles.sectionTitleBlock}>
          <Text style={[styles.sectionEyebrow, { color: colors.textTertiary }]}>GAME STORES</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Your Game</Text>
        </View>
      </View>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Choose a game & explore the store.
      </Text>
    </View>
    <View style={[styles.sectionAccent, { backgroundColor: colors.sectionAccent }]} />
  </View>
);

const StoreGameCard = ({ game, config, layout, onPress, closed = false, colors }) => {
  const { cardWidth, cardHeight } = layout;

  if (closed) {
    return (
      <View style={[styles.gridCell, { width: cardWidth }]}>
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
          <View style={styles.closedImageWrap}>
            <Image
              source={storeHeroImages[config.heroKey]}
              style={styles.closedHeroImage}
              resizeMode="contain"
            />
            <View style={styles.closedOverlay}>
              <AppIcon icon={UnavailableIcon} size={iconSize.xl} color={colors.textTertiary} />
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <View style={styles.cardTextBlock}>
              <Text style={[styles.closedCardTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {`${config.label} CLOSED`}
              </Text>
              <Text style={[styles.closedCardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                {game.game_name}
              </Text>
            </View>
            <View style={[styles.logoBadge, styles.logoBadgeMuted, { borderColor: colors.border }]}>
              <Image source={{ uri: game.game_logo_url }} style={styles.logoImage} resizeMode="cover" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.gridCell, { width: cardWidth }]}>
      <Pressable style={styles.cardPressable} onPress={onPress}>
        <LinearGradient
          colors={config.gradient}
          start={config.gradientStart || { x: 0, y: 0 }}
          end={config.gradientEnd || { x: 1, y: 1 }}
          style={[styles.gameCard, { width: cardWidth, height: cardHeight }]}
        >
          <View style={styles.imageWrap}>
            <Image
              source={storeHeroImages[config.heroKey]}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.footerGradient}
          >
            <View style={styles.cardFooter}>
              <View style={styles.cardTextBlock}>
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
            </View>
          </LinearGradient>
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
      cardBackground: isLight ? '#F8FAFC' : '#111111',
      text: isLight ? '#111827' : '#ffffff',
      textSecondary: isLight ? '#6B7280' : '#9CA3AF',
      textTertiary: isLight ? '#9CA3AF' : '#6B7280',
      border: isLight ? '#E5E7EB' : 'rgba(255, 255, 255, 0.12)',
      accent: '#00bf63',
      sectionAccent: isLight ? '#000000' : '#ffffff',
      sectionIcon: isLight ? '#000000' : '#ffffff',
      sectionIconBg: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)',
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
            <SectionHeader colors={colors} />

            <View style={[styles.grid, { width: layout.contentWidth }]}>
              {storeItems.map(({ game, config, isActive }) => (
                <StoreGameCard
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

            <Text
              style={[
                styles.deliveryQuote,
                {
                  color: colors.textSecondary,
                  borderTopColor: colors.border,
                },
              ]}
            >
              "Delivery within 5 minutes !"
            </Text>
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
    gap: spacing.lg,
  },
  deliveryQuote: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  sectionAccent: {
    width: 3,
    borderRadius: radius.full,
  },
  sectionHeaderContent: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  sectionEyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 4,
    paddingLeft: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'center',
    rowGap: GRID_GAP,
  },
  gridCell: {
    overflow: 'hidden',
  },
  cardPressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gameCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  imageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  footerGradient: {
    justifyContent: 'flex-end',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  logoBadgeMuted: {
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  closedCard: {
    borderWidth: 1.5,
  },
  closedImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    opacity: 0.45,
  },
  closedHeroImage: {
    width: '88%',
    height: '88%',
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
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
