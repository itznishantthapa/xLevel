import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  ClipPath,
  G,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../../../components/common/AppIcon';
import { StoreIcon, UnavailableIcon, Diamond02Icon, EnergyIcon } from '@hugeicons/core-free-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useUtils } from '../../../queries/useUtils';
import { useGames } from '../../../queries/useGames';
import { STORE_THEMES, storeCardLogos } from '../../../assets/store';
import AppHeader from '../header/AppHeader';
import { fontSize, spacing, radius, iconSize } from '../../../theme/typography';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.md;
const CARD_ASPECT = 1.45;
const GRID_ROW_GAP = spacing.lg;
const CONTENT_VERTICAL_PADDING = spacing.sm + spacing.xs;
const CONTENT_BLOCK_GAP = spacing.lg;
const SECTION_TITLE_GAP = spacing.sm;
const HEADER_ESTIMATE = 44;
const PROMO_ESTIMATE = 88;
const TITLE_ESTIMATE = 22;
const FOOTER_ESTIMATE = 52;

const getGridLayout = (windowWidth, availableGridHeight = 0) => {
  const contentWidth = windowWidth - HORIZONTAL_PADDING * 2;
  const cardWidth = Math.floor((contentWidth - GRID_GAP) / 2);
  let cardHeight = Math.round(cardWidth * CARD_ASPECT);

  if (availableGridHeight > 0) {
    const maxCardHeight = Math.floor((availableGridHeight - GRID_ROW_GAP) / 2);
    cardHeight = Math.min(cardHeight, Math.max(maxCardHeight, 0));
  }

  const gridContentHeight = cardHeight > 0 ? cardHeight * 2 + GRID_ROW_GAP : 0;

  return { contentWidth, cardWidth, cardHeight, gridContentHeight };
};

/**
 * Deep asymmetrical diagonal cut path:
 * - Top edge cuts early (28% width)
 * - Deep diagonal slant down to 44% of card height on the right side
 * - Creates a large empty notch so logo images pop out up to ~50%
 */
const buildCardPath = (w, h) => {
  const rTopLeft = 24;
  const rBottom = 20;
  const topEdgeEnd = w * 0.28;
  const slantEndY = h * 0.44;

  return `
    M ${rTopLeft} 0
    H ${topEdgeEnd}
    Q ${topEdgeEnd + 12} 0 ${topEdgeEnd + 24} 8
    L ${w - 6} ${slantEndY - 14}
    Q ${w} ${slantEndY} ${w} ${slantEndY + 14}
    V ${h - rBottom}
    Q ${w} ${h} ${w - rBottom} ${h}
    H ${rBottom}
    Q 0 ${h} 0 ${h - rBottom}
    V ${rTopLeft}
    Q 0 0 ${rTopLeft} 0
    Z
  `;
};

const CardCutBackground = ({ width, height, colors, id }) => {
  const path = buildCardPath(width, height);
  const clipId = `cardCutShape_${id}`;
  const gradId = `cardGradient_${id}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={path} />
        </ClipPath>
        <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </SvgGradient>
      </Defs>

      <G clipPath={`url(#${clipId})`}>
        {/* Gradient Background */}
        <Path d={path} fill={`url(#${gradId})`} />

        {/* Thick Curvy Wavy Background Lines */}
        <Path
          d={`M -20 ${height * 0.22} Q ${width * 0.45} ${height * 0.02} ${width + 30} ${height * 0.38}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="16"
          strokeLinecap="round"
          opacity={0.22}
        />
        <Path
          d={`M -30 ${height * 0.52} Q ${width * 0.55} ${height * 0.28} ${width + 20} ${height * 0.62}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
          opacity={0.16}
        />
        <Path
          d={`M -10 ${height * 0.8} Q ${width * 0.5} ${height * 0.98} ${width + 30} ${height * 0.68}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="20"
          strokeLinecap="round"
          opacity={0.18}
        />
      </G>
    </Svg>
  );
};

const STORE_CONFIG = [
  {
    ...STORE_THEMES.freefire,
    id: 'freefire',
    match: ['free fire', 'freefire'],
    route: 'freeFireStore',
    flag: 'is_freefire_store_active',
    subtitle: 'Topup diamonds, passes & more',
    logo: storeCardLogos.freefire,
  },
  {
    ...STORE_THEMES.pubg,
    id: 'pubg',
    match: ['pubg'],
    route: 'pubgStore',
    flag: 'is_pubg_store_active',
    subtitle: 'Topup UC, royale pass & items',
    logo: storeCardLogos.pubg,
  },
  {
    ...STORE_THEMES.efootball,
    id: 'efootball',
    match: ['efootball'],
    route: 'efootballStore',
    flag: 'is_efootball_store_active',
    subtitle: 'Topup coins, FC & subscriptions',
    cardLabel: 'Efootball , FC & more..',
    isStackedCard: true,
    stackedLogos: [storeCardLogos.fcmobile, storeCardLogos.efootball],
    logo: storeCardLogos.efootball,
  },
  {
    ...STORE_THEMES.mlbb,
    id: 'mlbb',
    match: ['mlbb'],
    route: 'mlbbStore',
    flag: 'is_mlbb_store_active',
    subtitle: 'Topup diamonds, passes & more',
    logo: storeCardLogos.mlbb,
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

const DeliveryNote = ({ isLight }) => (
  <View
    style={[
      styles.deliveryNote,
      {
        backgroundColor: isLight ? '#FFFFFF' : '#0F0F0F',
        borderColor: isLight ? '#E8E8E8' : 'rgba(255, 255, 255, 0.14)',
      },
    ]}
  >
    <AppIcon icon={EnergyIcon} size={iconSize.md} color="#00bf63" strokeWidth={2} />
    <Text style={[styles.deliveryTitle, { color: isLight ? '#000000' : '#FFFFFF' }]}>
      Delivery within 5 minutes!
    </Text>
  </View>
);

const StoreGameCard = ({ game, config, layout, onPress, closed = false, colors }) => {
  const { cardWidth, cardHeight } = layout;
  const logoSize = Math.round(cardWidth * 0.78);
  const displayName = config.cardLabel || game.game_name || config.label;
  const subtitleText = config.subtitle || 'Topup game currency & items';
  const gradientColors = closed ? ['#64748B', '#334155'] : (config.gradient || ['#3B82F6', '#1E40AF']);

  const cardContent = (
    <View
      style={[
        styles.cardShell,
        {
          width: cardWidth,
          height: cardHeight,
          shadowColor: colors.shadow,
        },
        closed && styles.closedCard,
      ]}
    >
      <CardCutBackground
        width={cardWidth}
        height={cardHeight}
        colors={gradientColors}
        id={config.id}
      />

      <View style={styles.logoStage}>
        {config.isStackedCard ? (
          <View style={styles.stackedWrap}>
            <Image
              source={config.stackedLogos?.[0] || config.logo}
              style={[
                styles.stackedCardBack,
                styles.logoRounded,
                { width: logoSize * 0.8, height: logoSize * 0.8 },
                closed && styles.logoClosed,
              ]}
              resizeMode="contain"
            />
            <Image
              source={config.stackedLogos?.[1] || config.logo}
              style={[
                styles.stackedCardFront,
                styles.logoRounded,
                { width: logoSize * 0.8, height: logoSize * 0.8 },
                closed && styles.logoClosed,
              ]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Image
            source={config.logo}
            style={[
              styles.logoPopOut,
              styles.logoRounded,
              { width: logoSize, height: logoSize },
              closed && styles.logoClosed,
            ]}
            resizeMode="contain"
          />
        )}

        {closed && (
          <View style={styles.closedOverlay}>
            <AppIcon icon={UnavailableIcon} size={iconSize.lg} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.actionPill}>
        <Text style={styles.actionPillTitle} numberOfLines={1}>
          {closed ? `${displayName} (Closed)` : displayName}
        </Text>
        <Text style={styles.actionPillSubtitle} numberOfLines={1}>
          {subtitleText}
        </Text>
      </View>
    </View>
  );

  if (closed) {
    return <View style={{ width: cardWidth }}>{cardContent}</View>;
  }

  return (
    <Pressable style={{ width: cardWidth }} onPress={onPress}>
      {cardContent}
    </Pressable>
  );
};

const GameStores = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const { data: utils = {} } = useUtils();
  const { data: games = [] } = useGames();
  const [layoutMetrics, setLayoutMetrics] = useState({
    content: 0,
    promo: 0,
    title: 0,
    footer: 0,
  });

  const fallbackGridHeight = useMemo(() => {
    const reserved =
      CONTENT_VERTICAL_PADDING +
      CONTENT_BLOCK_GAP * 2 +
      SECTION_TITLE_GAP +
      HEADER_ESTIMATE +
      PROMO_ESTIMATE +
      TITLE_ESTIMATE +
      FOOTER_ESTIMATE;

    return Math.max(0, windowHeight - insets.top - reserved);
  }, [windowHeight, insets.top]);

  const availableGridHeight = useMemo(() => {
    const { content, promo, title, footer } = layoutMetrics;

    if (!content) {
      return fallbackGridHeight;
    }

    const reserved =
      CONTENT_VERTICAL_PADDING +
      CONTENT_BLOCK_GAP * 2 +
      SECTION_TITLE_GAP +
      (promo || PROMO_ESTIMATE) +
      (title || TITLE_ESTIMATE) +
      (footer || FOOTER_ESTIMATE);

    return Math.max(0, content - reserved);
  }, [layoutMetrics, fallbackGridHeight]);

  const layout = useMemo(
    () => getGridLayout(windowWidth, availableGridHeight),
    [windowWidth, availableGridHeight],
  );

  const updateLayoutMetric = useCallback((key, value) => {
    setLayoutMetrics((current) => {
      if (current[key] === value) return current;
      return { ...current, [key]: value };
    });
  }, []);

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
      background: isLight ? '#F1F5F9' : '#0A0A0A',
      text: isLight ? '#0F172A' : '#FFFFFF',
      textSecondary: isLight ? '#64748B' : '#94A3B8',
      textTertiary: isLight ? '#94A3B8' : '#64748B',
      shadow: '#000000',
      promoGradient: isLight ? ['#1E293B', '#0F172A'] : ['#1E293B', '#0A0A0A'],
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

      <View
        style={styles.content}
        onLayout={({ nativeEvent }) => {
          updateLayoutMetric('content', Math.round(nativeEvent.layout.height));
        }}
      >
        <View
          style={styles.promoWrap}
          onLayout={({ nativeEvent }) => {
            updateLayoutMetric('promo', Math.round(nativeEvent.layout.height));
          }}
        >
          <PromoBanner colors={colors} />
        </View>

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
          <>
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.text }]}
                onLayout={({ nativeEvent }) => {
                  updateLayoutMetric('title', Math.round(nativeEvent.layout.height));
                }}
              >
                Game Stores
              </Text>

              <View
                style={[
                  styles.grid,
                  {
                    width: layout.contentWidth,
                    height: layout.gridContentHeight || undefined,
                  },
                ]}
              >
                {layout.cardHeight > 0
                  ? storeItems.map(({ game, config, isActive }) => (
                      <StoreGameCard
                        key={config.id}
                        game={game}
                        config={config}
                        layout={layout}
                        colors={colors}
                        closed={!isActive}
                        onPress={isActive ? () => handleStorePress(game, config) : undefined}
                      />
                    ))
                  : null}
              </View>
            </View>

            <View
              style={styles.deliveryFooter}
              onLayout={({ nativeEvent }) => {
                updateLayoutMetric('footer', Math.round(nativeEvent.layout.height));
              }}
            >
              <DeliveryNote isLight={isLight} />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default GameStores;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: CONTENT_BLOCK_GAP,
  },
  promoWrap: {
    flexShrink: 0,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
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
    flex: 1,
    minHeight: 0,
    gap: SECTION_TITLE_GAP,
  },
  sectionTitle: {
    flexShrink: 0,
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  grid: {
    flexShrink: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    alignSelf: 'center',
    rowGap: GRID_ROW_GAP,
  },
  cardShell: {
    position: 'relative',
    overflow: 'visible', // Essential for the ~50% image pop-out effect
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm + 2,
    paddingTop: spacing.xs,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  closedCard: {
    opacity: 0.75,
  },
  logoStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 2,
  },
  logoRounded: {
    borderRadius: radius['2xl'],
  },
  logoPopOut: {
    zIndex: 2,
    // Negative translates to push logo up and right past the diagonal cut
    transform: [{ translateY: -22 }, { translateX: 12 }],
  },
  stackedWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 2,
    transform: [{ translateY: -18 }, { translateX: 8 }],
  },
  stackedCardBack: {
    position: 'absolute',
    transform: [{ rotate: '-16deg' }, { translateX: -16 }, { translateY: -4 }],
    opacity: 0.82,
    zIndex: 1,
  },
  stackedCardFront: {
    position: 'absolute',
    transform: [{ rotate: '12deg' }, { translateX: 12 }, { translateY: 4 }],
    zIndex: 2,
  },
  logoClosed: {
    opacity: 0.35,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  actionPill: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  actionPillTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  actionPillSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
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
  deliveryFooter: {
    flexShrink: 0,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  deliveryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});