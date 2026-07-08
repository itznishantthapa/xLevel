import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { AppIcon } from '../../components/common/AppIcon';
import {
  ReceiptDollarIcon,
  GiftCard02Icon,
  Trophy,
  GamepadIcon,
} from '@hugeicons/core-free-icons';
import { useThemeStore } from '../../store/themeStore';
import { fontSize, spacing, radius, iconSize, lineHeight } from '../../theme/typography';

const STAT_ITEMS = [
  { id: 'requests', name: 'Request', icon: ReceiptDollarIcon, color: '#16A34A' },
  { id: 'redeem', name: 'Redeem', icon: GiftCard02Icon, color: '#F97316' },
  { id: 'tournament', name: 'Tournaments', icon: Trophy, color: '#6366F1' },
  { id: 'matches', name: 'My Match', icon: GamepadIcon, color: '#ff2c2c' },
];

const StatsContainer = ({
  handleRequests,
  handleRedeem,
  handleTournament,
  handleMatches,
}) => {
  const { isLight } = useThemeStore();

  const handlers = {
    requests: handleRequests,
    redeem: handleRedeem,
    tournament: handleTournament,
    matches: handleMatches,
  };

  const cardThemeStyle = isLight
    ? { borderColor: '#1A1A1A', backgroundColor: '#FFFFFF' }
    : { borderColor: '#EAEAEA', backgroundColor: '#000000' };

  return (
    <View style={styles.gridContainer}>
      {STAT_ITEMS.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.statCard, cardThemeStyle]}
          onPress={() => handlers[item.id]?.()}
        >
          <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
            <AppIcon icon={item.icon} size={iconSize.lg} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text
            style={[styles.statLabel, isLight ? styles.labelLight : styles.labelDark]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default StatsContainer;

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: lineHeight.sm,
    textAlign: 'center',
  },
  labelLight: { color: '#333333' },
  labelDark: { color: '#EAEAEA' },
});
