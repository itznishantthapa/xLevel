import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  ClipPath,
  G,
} from 'react-native-svg';
import { STORE_THEMES, storeHeroImages, storeStackedHeroImages } from '../../../assets/store';
import { fontSize, spacing, radius } from '../../../theme/typography';

const HEADER_PADDING = spacing.lg;
const HEADER_ASPECT_RATIO = 0.42;

/**
 * Horizontal header diagonal cut (mirrors GameStores card):
 * - Top edge ends around 62% width
 * - Curved diagonal slants down to the right edge
 * - Opens a top-right notch so the hero logo can pop out
 */
const buildHeaderPath = (w, h) => {
  const rTopLeft = radius.lg;
  const rBottom = radius.lg;
  const topEdgeEnd = w * 0.62;
  const slantEndY = h * 0.5;

  return `
    M ${rTopLeft} 0
    H ${topEdgeEnd}
    Q ${topEdgeEnd + 10} 0 ${topEdgeEnd + 20} 7
    L ${w - 6} ${slantEndY - 12}
    Q ${w} ${slantEndY} ${w} ${slantEndY + 12}
    V ${h - rBottom}
    Q ${w} ${h} ${w - rBottom} ${h}
    H ${rBottom}
    Q 0 ${h} 0 ${h - rBottom}
    V ${rTopLeft}
    Q 0 0 ${rTopLeft} 0
    Z
  `;
};

const HeaderBackground = ({ width, height, colors, id }) => {
  const path = buildHeaderPath(width, height);
  const clipId = `headerCutShape_${id}`;
  const gradId = `headerGradient_${id}`;

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
        <Path d={path} fill={`url(#${gradId})`} />
        <Path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1"
        />

        <Path
          d={`M -20 ${height * 0.18} Q ${width * 0.42} ${height * 0.02} ${width + 24} ${height * 0.34}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.2}
        />
        <Path
          d={`M -24 ${height * 0.58} Q ${width * 0.5} ${height * 0.36} ${width + 16} ${height * 0.68}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          opacity={0.14}
        />

        <Path
          d={`M 0 ${height * 0.72} L ${width} ${height} L 0 ${height} Z`}
          fill="rgba(0, 0, 0, 0.1)"
        />
      </G>
    </Svg>
  );
};

const StoreScreenHeader = ({ storeKey }) => {
  const { width: windowWidth } = useWindowDimensions();
  const theme = STORE_THEMES[storeKey];

  const layout = useMemo(() => {
    const headerWidth = windowWidth - HEADER_PADDING * 2;
    const headerHeight = Math.round(headerWidth * HEADER_ASPECT_RATIO);
    const logoSize = Math.round(headerHeight * 0.72);

    return { headerWidth, headerHeight, logoSize };
  }, [windowWidth]);

  const stackedLogos = storeStackedHeroImages[storeKey];
  const hasStackedLogos = stackedLogos?.length >= 2;
  const stackedLogoSize = Math.round(layout.logoSize * 0.78);

  if (!theme) return null;

  const gradientColors = theme.gradient?.length >= 2
    ? [theme.gradient[0], theme.gradient[theme.gradient.length - 1]]
    : ['#3B82F6', '#1E40AF'];

  const logoColumnWidth = hasStackedLogos
    ? stackedLogoSize + spacing.xl
    : layout.logoSize + spacing.md;

  return (
    <View style={[styles.wrapper, { paddingHorizontal: HEADER_PADDING }]}>
      <View
        style={[
          styles.headerCard,
          {
            width: layout.headerWidth,
            height: layout.headerHeight,
          },
        ]}
      >
        <HeaderBackground
          width={layout.headerWidth}
          height={layout.headerHeight}
          colors={gradientColors}
          id={storeKey}
        />

        <View style={styles.contentRow}>
          <View style={styles.textColumn}>
            <View style={styles.infoPill}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {theme.label}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {theme.subtitle}
              </Text>
            </View>
          </View>

          <View style={[styles.logoColumn, { width: logoColumnWidth }]}>
            {hasStackedLogos ? (
              <View
                style={[
                  styles.stackedWrap,
                  { width: stackedLogoSize + spacing.lg, height: stackedLogoSize + spacing.md },
                ]}
              >
                <View
                  style={[
                    styles.heroImageWrap,
                    styles.stackedCardBack,
                    { width: stackedLogoSize, height: stackedLogoSize },
                  ]}
                >
                  <Image source={stackedLogos[0]} style={styles.heroImage} resizeMode="cover" />
                </View>
                <View
                  style={[
                    styles.heroImageWrap,
                    styles.stackedCardFront,
                    { width: stackedLogoSize, height: stackedLogoSize },
                  ]}
                >
                  <Image source={stackedLogos[1]} style={styles.heroImage} resizeMode="cover" />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.heroImageWrap,
                  {
                    width: layout.logoSize,
                    height: layout.logoSize,
                  },
                ]}
              >
                <Image
                  source={storeHeroImages[storeKey]}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default StoreScreenHeader;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCard: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    zIndex: 2,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: spacing.sm,
  },
  infoPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
  },
  logoColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    zIndex: 3,
  },
  heroImageWrap: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ translateY: -18 }, { translateX: 8 }],
  },
  stackedWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    transform: [{ translateY: -18 }, { translateX: 8 }],
  },
  stackedCardBack: {
    position: 'absolute',
    transform: [{ rotate: '-16deg' }, { translateX: -14 }, { translateY: -4 }],
    opacity: 0.82,
    zIndex: 1,
  },
  stackedCardFront: {
    position: 'absolute',
    transform: [{ rotate: '12deg' }, { translateX: 10 }, { translateY: 4 }],
    zIndex: 2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 2,
  },
});
