import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STORE_THEMES, storeHeroImages } from '../../../assets/store';
import { fontSize, spacing, radius } from '../../../theme/typography';

const HEADER_PADDING = spacing.lg;
const HEADER_ASPECT_RATIO = 0.36;

const StoreScreenHeader = ({ storeKey, gameLogoUrl }) => {
  const { width: windowWidth } = useWindowDimensions();
  const theme = STORE_THEMES[storeKey];

  const layout = useMemo(() => {
    const headerWidth = windowWidth - HEADER_PADDING * 2;
    const headerHeight = Math.round(headerWidth * HEADER_ASPECT_RATIO);

    return { headerWidth, headerHeight };
  }, [windowWidth]);

  if (!theme) return null;

  return (
    <View style={[styles.wrapper, { paddingHorizontal: HEADER_PADDING }]}>
      <LinearGradient
        colors={theme.gradient}
        start={theme.gradientStart || { x: 0, y: 0 }}
        end={theme.gradientEnd || { x: 1, y: 1 }}
        style={[
          styles.headerCard,
          {
            width: layout.headerWidth,
            height: layout.headerHeight,
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={styles.textColumn}>
            {gameLogoUrl ? (
              <View style={styles.logoBadge}>
                <Image source={{ uri: gameLogoUrl }} style={styles.logoImage} resizeMode="cover" />
              </View>
            ) : null}

            <View style={styles.titleBlock}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {theme.label}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {theme.subtitle}
              </Text>
            </View>
          </View>

          <View style={styles.imageColumn}>
            <Image
              source={storeHeroImages[storeKey]}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={styles.footerOverlay}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  );
};

export default StoreScreenHeader;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  headerCard: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingRight: spacing.sm,
    zIndex: 2,
  },
  titleBlock: {
    justifyContent: 'flex-end',
    gap: spacing.xxs,
  },
  imageColumn: {
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  footerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 2,
  },
});
