import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STORE_THEMES, storeHeroImages } from '../../../assets/store';
import { fontSize, spacing, radius } from '../../../theme/typography';

const HEADER_PADDING = spacing.xl;
const HEADER_ASPECT_RATIO = 0.34;
const HERO_OVERFLOW_RATIO = 0.3;
const HERO_WIDTH_RATIO = 0.44;
const HERO_HEIGHT_RATIO = 1.1;

const StoreScreenHeader = ({ storeKey, gameLogoUrl }) => {
  const { width: windowWidth } = useWindowDimensions();
  const theme = STORE_THEMES[storeKey];

  const layout = useMemo(() => {
    const headerWidth = windowWidth - HEADER_PADDING * 2;
    const headerHeight = Math.round(headerWidth * HEADER_ASPECT_RATIO);
    const heroOverflow = Math.round(headerHeight * HERO_OVERFLOW_RATIO);
    const heroWidth = Math.round(headerWidth * HERO_WIDTH_RATIO);
    const heroHeight = Math.round(headerHeight * HERO_HEIGHT_RATIO);

    return {
      headerWidth,
      headerHeight,
      heroOverflow,
      heroWidth,
      heroHeight,
    };
  }, [windowWidth]);

  if (!theme) return null;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: HEADER_PADDING,
          paddingTop: layout.heroOverflow,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <View style={[styles.headerCell, { width: layout.headerWidth }]}>
        <Image
          source={storeHeroImages[storeKey]}
          style={[
            styles.heroImage,
            {
              width: layout.heroWidth,
              height: layout.heroHeight,
              top: -layout.heroOverflow,
              right: -spacing.xs,
            },
          ]}
          resizeMode="contain"
        />

        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerCard,
            {
              width: layout.headerWidth,
              height: layout.headerHeight,
            },
          ]}
        >
          {gameLogoUrl ? (
            <View style={styles.logoBadge}>
              <Image source={{ uri: gameLogoUrl }} style={styles.logoImage} resizeMode="cover" />
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {theme.label}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {theme.subtitle}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default StoreScreenHeader;

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  headerCell: {
    overflow: 'visible',
    alignSelf: 'center',
  },
  heroImage: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  headerCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  logoBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 38,
    height: 38,
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
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xxs,
  },
});
