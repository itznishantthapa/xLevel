import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../../../components/common/AppIcon';
import { StoreIcon } from '@hugeicons/core-free-icons';
import { useThemeStore } from '../../../store/themeStore';
import { useUtils } from '../../../queries/useUtils';
import { useGames } from '../../../queries/useGames';
import { fontSize, spacing, radius, iconSize } from '../../../theme/typography';

const STORE_CONFIG = [
  { match: ['free fire', 'freefire'], route: 'freeFireStore', flag: 'is_freefire_store_active' },
  { match: ['pubg'], route: 'pubgStore', flag: 'is_pubg_store_active' },
  { match: ['efootball'], route: 'efootballStore', flag: 'is_efootball_store_active' },
  { match: ['mlbb'], route: 'mlbbStore', flag: 'is_mlbb_store_active' },
];

const getStoreConfig = (gameName = '') => {
  const name = gameName.toLowerCase();
  return STORE_CONFIG.find(({ match }) => match.some((token) => name.includes(token)));
};

const GameStores = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const { data: utils = {} } = useUtils();
  const { data: games = [] } = useGames();

  const isIOSActive = !!utils?.is_ios_active;
  const shouldShowStores = Platform.OS === 'android' || isIOSActive;
  const storeFlags = utils?.active_store || {};

  const storeGames = useMemo(() => {
    if (!shouldShowStores) return [];

    return games.filter((game) => {
      const config = getStoreConfig(game.game_name);
      return config && storeFlags[config.flag];
    });
  }, [games, shouldShowStores, storeFlags]);

  const handleStorePress = useCallback(
    (game) => {
      const config = getStoreConfig(game.game_name);
      if (config) {
        navigation.navigate(config.route, { game });
      }
    },
    [navigation],
  );

  const cardThemeStyle = isLight
    ? { borderColor: '#1A1A1A', backgroundColor: '#FFFFFF' }
    : { borderColor: '#EAEAEA', backgroundColor: '#000000' };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? '#FFFFFF' : '#000000', paddingTop: insets.top },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isLight ? '#000000' : '#FFFFFF' }]}>
          Store
        </Text>
        <View style={[styles.headingUnderline, { backgroundColor: isLight ? '#000000' : '#FFFFFF' }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {storeGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppIcon icon={StoreIcon} size={52} color={isLight ? '#CCCCCC' : '#444444'} />
            <Text style={[styles.emptyTitle, { color: isLight ? '#1A1A1A' : '#FFFFFF' }]}>
              No Stores Available
            </Text>
            <Text style={[styles.emptySubtitle, { color: isLight ? '#666666' : '#999999' }]}>
              Check back later for game top-ups and items.
            </Text>
          </View>
        ) : (
          storeGames.map((game) => (
            <Pressable
              key={game.game_id}
              style={[styles.storeCard, cardThemeStyle]}
              onPress={() => handleStorePress(game)}
            >
              <Image source={{ uri: game.game_logo_url }} style={styles.storeLogo} />
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: isLight ? '#1A1A1A' : '#FFFFFF' }]}>
                  {game.game_name}
                </Text>
                <Text style={[styles.storeSubtitle, { color: isLight ? '#666666' : '#999999' }]}>
                  Top up & game items
                </Text>
              </View>
              <AppIcon
                icon={StoreIcon}
                size={iconSize.md}
                color={isLight ? '#1A1A1A' : '#FFFFFF'}
                strokeWidth={2}
              />
            </Pressable>
          ))
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
  header: {
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  headingUnderline: {
    width: 40,
    height: 2,
    marginTop: spacing.xs + 2,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    marginRight: fontSize.base,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  storeSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing['2xl'],
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
