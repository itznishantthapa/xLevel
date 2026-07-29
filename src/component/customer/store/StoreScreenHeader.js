import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  ClipPath,
  G,
  Circle,
  Ellipse,
} from 'react-native-svg';
import { STORE_THEMES, storeHeroImages, storeStackedHeroImages } from '../../../assets/store';
import { fontSize, spacing, radius } from '../../../theme/typography';

const HEADER_PADDING = spacing.lg;
const HEADER_ASPECT_RATIO = 0.4;

/**
 * Rounded header path with a large top-right radius for a smooth circular cut
 * (matches GameStores card shape) so the hero logo can pop out at the top-right.
 */
const buildHeaderPath = (w, h) => {
  const rTopLeft = 24;
  const rTopRight = Math.min(w * 0.52, h * 0.55);
  const rBottom = 20;

  return `
    M ${rTopLeft} 0
    H ${w - rTopRight}
    Q ${w} 0 ${w} ${rTopRight}
    V ${h - rBottom}
    Q ${w} ${h} ${w - rBottom} ${h}
    H ${rBottom}
    Q 0 ${h} 0 ${h - rBottom}
    V ${rTopLeft}
    Q 0 0 ${rTopLeft} 0
    Z
  `;
};

const DECOR_DOTS = [
  { cx: 0.14, cy: 0.22, r: 3.5, opacity: 0.28 },
  { cx: 0.28, cy: 0.12, r: 2, opacity: 0.2 },
  { cx: 0.52, cy: 0.08, r: 2.5, opacity: 0.16 },
  { cx: 0.72, cy: 0.18, r: 2, opacity: 0.14 },
  { cx: 0.38, cy: 0.34, r: 1.5, opacity: 0.12 },
];

const HeaderBackground = ({ width, height, colors, id }) => {
  const path = buildHeaderPath(width, height);
  const clipId = `headerCutShape_${id}`;
  const gradId = `headerGradient_${id}`;
  const glowLeftId = `headerGlowLeft_${id}`;
  const glowRightId = `headerGlowRight_${id}`;
  const vignetteId = `headerVignette_${id}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={path} />
        </ClipPath>

        <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="55%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2] || colors[1]} />
        </SvgGradient>

        <RadialGradient id={glowLeftId} cx="18%" cy="22%" rx="42%" ry="38%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.34} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>

        <RadialGradient id={glowRightId} cx="88%" cy="78%" rx="36%" ry="32%">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>

        <SvgGradient id={vignetteId} x1="0%" y1="60%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.18} />
        </SvgGradient>
      </Defs>

      <G clipPath={`url(#${clipId})`}>
        <Path d={path} fill={`url(#${gradId})`} />

        <Ellipse
          cx={width * 0.12}
          cy={height * 0.28}
          rx={width * 0.22}
          ry={height * 0.34}
          fill={`url(#${glowLeftId})`}
        />
        <Ellipse
          cx={width * 0.9}
          cy={height * 0.82}
          rx={width * 0.28}
          ry={height * 0.28}
          fill={`url(#${glowRightId})`}
        />

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

        {DECOR_DOTS.map((dot, index) => (
          <Circle
            key={`dot_${index}`}
            cx={width * dot.cx}
            cy={height * dot.cy}
            r={dot.r}
            fill="#FFFFFF"
            opacity={dot.opacity}
          />
        ))}

        <Path
          d={`M ${width * 0.06} ${height * 0.46} Q ${width * 0.34} ${height * 0.38} ${width * 0.58} ${height * 0.5}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />

        <Path d={path} fill={`url(#${vignetteId})`} />

        <Path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
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
    const logoSize = Math.round(headerHeight * 0.68);

    return { headerWidth, headerHeight, logoSize };
  }, [windowWidth]);

  const stackedLogos = storeStackedHeroImages[storeKey];
  const hasStackedLogos = stackedLogos?.length >= 2;
  const stackedLogoSize = Math.round(layout.logoSize * 0.76);

  if (!theme) return null;

  const gradientStops = theme.gradient?.length >= 2
    ? theme.gradient
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
          colors={gradientStops}
          id={storeKey}
        />

        <View style={styles.contentRow}>
          <View style={styles.textColumn}>
            <View style={styles.infoPill}>
              <View style={styles.titleRow}>
                <View style={styles.titleAccent} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {theme.label}
                </Text>
              </View>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {theme.subtitle}
              </Text>
            </View>
          </View>

          <View style={[styles.logoColumn, { width: logoColumnWidth }]}>
            <View style={[styles.logoGlow, hasStackedLogos && styles.logoGlowStacked]} />

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
    paddingTop: spacing.sm,
  },
  headerCard: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 2,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  infoPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs + 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  titleAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  logoColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 3,
  },
  logoGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ translateY: -10 }, { translateX: 4 }],
    zIndex: 0,
  },
  logoGlowStacked: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  heroImageWrap: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ translateY: -12 }, { translateX: 4 }],
  },
  stackedWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    transform: [{ translateY: -12 }, { translateX: 4 }],
  },
  stackedCardBack: {
    position: 'absolute',
    transform: [{ rotate: '-14deg' }, { translateX: -12 }, { translateY: -2 }],
    opacity: 0.84,
    zIndex: 1,
  },
  stackedCardFront: {
    position: 'absolute',
    transform: [{ rotate: '10deg' }, { translateX: 8 }, { translateY: 3 }],
    zIndex: 2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 3,
    paddingLeft: spacing.xs + 3,
  },
});
