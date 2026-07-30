import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STORE_THEMES, storeHeroImages, storeStackedHeroImages } from '../../../assets/store';
import { fontSize, spacing, radius } from '../../../theme/typography';

const HEADER_PADDING = spacing.lg;
const HEADER_HEIGHT = 112;

const LightStoreHeader = ({ storeKey }) => {
  const { width: windowWidth } = useWindowDimensions();
  const theme = STORE_THEMES[storeKey];

  const layout = useMemo(() => {
    const headerWidth = windowWidth - HEADER_PADDING * 2;
    const logoSize = 64;
    const stackedLogoSize = 52;

    return { headerWidth, logoSize, stackedLogoSize };
  }, [windowWidth]);

  if (!theme) return null;

  const gradientStops = theme.gradient?.length >= 2 ? theme.gradient : ['#3B82F6', '#1E40AF'];
  const stackedLogos = storeStackedHeroImages[storeKey];
  const hasStackedLogos = stackedLogos?.length >= 2;

  return (
    <View style={[styles.wrapper, { paddingHorizontal: HEADER_PADDING }]}>
      <LinearGradient
        colors={gradientStops}
        start={theme.gradientStart ?? { x: 0, y: 0 }}
        end={theme.gradientEnd ?? { x: 1, y: 1 }}
        style={[styles.header, { width: layout.headerWidth }]}
      >
        <View style={styles.contentRow}>
          <View style={styles.textColumn}>
            <Text style={styles.title} numberOfLines={2}>
              {theme.label}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {theme.subtitle}
            </Text>
          </View>

          {hasStackedLogos ? (
            <View style={styles.stackedWrap}>
              <Image
                source={stackedLogos[0]}
                style={[
                  styles.logo,
                  styles.stackedBack,
                  { width: layout.stackedLogoSize, height: layout.stackedLogoSize },
                ]}
                resizeMode="cover"
              />
              <Image
                source={stackedLogos[1]}
                style={[
                  styles.logo,
                  styles.stackedFront,
                  { width: layout.stackedLogoSize, height: layout.stackedLogoSize },
                ]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <Image
              source={storeHeroImages[storeKey]}
              style={[styles.logo, { width: layout.logoSize, height: layout.logoSize }]}
              resizeMode="cover"
            />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

export default LightStoreHeader;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.base + 2,
  },
  logo: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  stackedWrap: {
    width: 72,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedBack: {
    position: 'absolute',
    transform: [{ rotate: '-10deg' }, { translateX: -8 }],
    opacity: 0.85,
  },
  stackedFront: {
    position: 'absolute',
    transform: [{ rotate: '8deg' }, { translateX: 8 }],
  },
});
