import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../../store/themeStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import Toast from 'react-native-simple-toast';
import { useGames } from '../../../queries/useGames';
import { useOpenChallenge } from '../../../queries/useOpenChallenges';
import { useBottomSheet } from '../../../context/BottomSheetContext';
import OpenGameList from '../../../component/matchcard/matchList/OpenGameList';
import { queryClient } from '../../../lib/queryClient';
import { useJoinMatch } from '../../../queries/useMutation/useJoinMatch';
import Loader from '../../../component/Loader';


const MainTab = ({ gameId, gameName }) => {
  // Global state and hooks
  const { isLight } = useThemeStore();
  const { data: games = [] } = useGames();
  const { mutateAsync: joinMatch } = useJoinMatch();
  const [selectedMode, setSelectedMode] = useState(null);
  const {
    data: { flat: openChallenges = [], hasMore = false } = {},
    fetchNextPage,
    refetch,
    isFetching,
    isFetchingNextPage,
  } = useOpenChallenge(10, gameId, selectedMode);

  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();
  const { showJoinSheet } = useBottomSheet();

  // Local state
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRefreshingScreen, setIsRefreshingScreen] = useState(false);
  const [isJoiningChallenge, setIsJoiningChallenge] = useState(false);

  // Derived state
  const isLoading = ((!openChallenges.length) && isFetching) || isRefreshingScreen;

  // Current game from cache by provided id
  const currentGame = useMemo(() => {
    if (!games?.length) return undefined;
    return games.find(g => g?.game_id === gameId);
  }, [games, gameId]);

  /**
   * Shows join game confirmation sheet
   */
  const handleShowJoinSheet = (game, user) => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }
    setSelectedGame(game);
    setSelectedUser(user);
    showJoinSheet({ game, onConfirm: handleConfirmChallenge });
  };

  // Get access to the matches query functions
  // const { prependChallenge, invalidateMatchesQuery } = useInfiniteMatches();








  /**
   * Handles filter changes for game modes
   */
  const handleFilterChange = (gameMode) => {
    setSelectedMode(gameMode === "All" ? null : gameMode);
  };

  /**
   * Handles user reporting - navigates to ReportUser screen
   */
  const handleReportUser = (game) => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    // Extract game creator info
    const reportedUser = {
      id: game?.created_by?.id || game?.creator_id,
      name: game?.created_by?.full_name || game?.creator_name || 'Unknown User'
    };

    const payload = {
      reportedUserId: reportedUser.id,
      reportedUserName: reportedUser.name,
      gameId: game?.id,
      gameName: game?.game?.name,
      gameMode: game?.game?.game_mode
    };



    // Navigate to ReportUser screen
    navigation.navigate('reportUser', {
      user: reportedUser,
      gameInfo: {
        id: game?.id,
        name: game?.game?.name,
        mode: game?.game?.game_mode
      }
    });
  };










  /**
   * Handles challenge confirmation and joining
   */
  const handleConfirmChallenge = async (joinData) => {
    try {
      setIsJoiningChallenge(true);
      
      // joinData can be either just the challenge_id (backward compatibility) 
      // or an object with challenge_id and access_code
      const payload = typeof joinData === 'object' ? joinData : { challenge_id: joinData };

      await joinMatch(payload);

      navigation.reset({
        index: 1,
        routes: [
          { name: 'customerTabs' },
          { name: 'match' }
        ],
      });

    } catch (error) {
      Toast.show(error?.message || "Failed to join challenge.", Toast.SHORT);
    } finally {
      setIsJoiningChallenge(false);
    }
  };


  const handleLoadMore = async () => {
    if (!hasMore || isFetchingNextPage) return;
    try {
      await fetchNextPage();
    } catch (error) {
      Toast.show('Failed to load more challenges. Please try again.', Toast.SHORT);
    }
  };

  const handleRefresh = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    try {
      setIsRefreshingScreen(true);
      queryClient.removeQueries({ queryKey: ["openChallenge", 10] });
      await refetch();
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to refresh challenges:', error);
      }
    } finally {
      setIsRefreshingScreen(false);
    }
  };

  // Derive game modes from current game if available
  const freeFireModes = useMemo(() => {
    const modes = currentGame?.game_modes;
    return Array.isArray(modes) ? modes : [];
  }, [currentGame]);

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#eef0f2' : '#000000' }]}>
      {/* Games List */}
      <OpenGameList
        games={openChallenges}
        showFilters={true}
        isLoading={isLoading}
        isRefreshing={isRefreshingScreen}
        isLoadingMore={isFetchingNextPage}
        handleConfirmChallenge={handleShowJoinSheet}
        handleReportUser={handleReportUser}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        gameModes={freeFireModes}
        gameName={currentGame?.game_name || gameName}
        onFilterChange={handleFilterChange}
      />
      
      {/* Loader for challenge joining */}
      <Loader 
        visible={isJoiningChallenge} 
        message="Joining Match..."
        size={56}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MainTab;