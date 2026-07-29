import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

import { AppIcon } from '../../components/common/AppIcon';
import { CAROUSEL_GAME_OPTIONS, MAX_CAROUSEL_GAMES } from '../../constants/games';
import { useThemeStore } from '../../store/themeStore';
import { fontSize, iconSize, radius, spacing } from '../../theme/typography';
import {
  getSelectedGameIds,
  saveSelectedGameIds,
} from '../../utils/selectedGamesStorage';

const GameSelection = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore();
  const canGoBack = navigation.canGoBack();

  const [selectedIds, setSelectedIds] = useState([]);

  const colors = {
    background: isLight ? '#ffffff' : '#000000',
    text: isLight ? '#111111' : '#f5f5f5',
    textMuted: isLight ? '#888888' : '#888888',
    chipBorder: isLight ? '#1a1a1a' : '#ffffff',
    chipBg: isLight ? '#ffffff' : '#000000',
    chipText: isLight ? '#333333' : '#cccccc',
    chipSelectedBg: isLight ? '#111111' : '#ffffff',
    chipSelectedText: isLight ? '#ffffff' : '#111111',
    chipSelectedBorder: isLight ? '#111111' : '#ffffff',
    action: isLight ? '#111111' : '#f5f5f5',
  };

  useEffect(() => {
    let isActive = true;

    getSelectedGameIds().then((stored) => {
      if (!isActive) return;

      const ids = stored ?? [];
      setSelectedIds(ids);

      if (!canGoBack && ids.length === MAX_CAROUSEL_GAMES) {
        navigation.replace('auth');
      }
    });

    return () => {
      isActive = false;
    };
  }, [canGoBack, navigation]);

  const toggleGame = (gameId) => {
    setSelectedIds((prev) => {
      if (prev.includes(gameId)) {
        return prev.filter((id) => id !== gameId);
      }

      if (prev.length >= MAX_CAROUSEL_GAMES) {
        Toast.show(`You can only select ${MAX_CAROUSEL_GAMES} games.`, Toast.SHORT);
        return prev;
      }

      return [...prev, gameId];
    });
  };

  const handleSave = useCallback(async () => {
    if (selectedIds.length !== MAX_CAROUSEL_GAMES) {
      Toast.show(`Please select ${MAX_CAROUSEL_GAMES} games to continue.`, Toast.SHORT);
      return;
    }

    await saveSelectedGameIds(selectedIds);

    if (canGoBack) {
      navigation.goBack();
      return;
    }

    navigation.replace('auth');
  }, [canGoBack, navigation, selectedIds]);

  const canProceed = selectedIds.length === MAX_CAROUSEL_GAMES;

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {canGoBack && (
          <Pressable
            style={[styles.backButton, { top: insets.top + spacing.md }]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <AppIcon icon={ArrowLeft01Icon} size={iconSize.lg} color={colors.text} />
          </Pressable>
        )}

        <View
          style={[
            styles.centerWrap,
            {
              paddingTop: insets.top + spacing['3xl'],
              paddingBottom: Math.max(insets.bottom + spacing.xl, spacing['2xl']),
            },
          ]}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Choose Your Games</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Select {MAX_CAROUSEL_GAMES} games for your create match carousel.
              </Text>
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Tap to select & unselect
              </Text>
            </View>

            <View style={styles.chipsWrap}>
              {CAROUSEL_GAME_OPTIONS.map((game) => {
                const isSelected = selectedIds.includes(game.game_id);

                return (
                  <Pressable
                    key={game.game_id}
                    onPress={() => toggleGame(game.game_id)}
                    style={({ pressed }) => [
                      styles.chip,
                      isSelected
                        ? {
                            backgroundColor: colors.chipSelectedBg,
                            borderColor: colors.chipSelectedBorder,
                          }
                        : {
                            backgroundColor: colors.chipBg,
                            borderColor: colors.chipBorder,
                          },
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        {
                          color: isSelected ? colors.chipSelectedText : colors.chipText,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {game.game_name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {selectedIds.length} of {MAX_CAROUSEL_GAMES} selected
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!canProceed}
                style={({ pressed }) => [
                  styles.nextButton,
                  {
                    borderColor: colors.chipBorder,
                    backgroundColor: canProceed ? colors.chipSelectedBg : colors.chipBg,
                    opacity: canProceed ? (pressed ? 0.85 : 1) : 0.4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nextText,
                    { color: canProceed ? colors.chipSelectedText : colors.chipText },
                  ]}
                >
                  {canGoBack ? 'Save' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default GameSelection;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing['2xl'],
    zIndex: 10,
    padding: spacing.xs,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  container: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
  },
  helperText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  chip: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipLabel: {
    fontSize: fontSize.md,
    letterSpacing: 0.15,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing['3xl'] + spacing.sm,
    gap: spacing.lg,
  },
  counter: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nextButton: {
    minWidth: 140,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  nextText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
