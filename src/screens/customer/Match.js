import React, { useState, useCallback } from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-simple-toast'
import { useNavigation } from '@react-navigation/native'

// Components
// import MatchesList from '../../component/customer/match/MatchesList'

// Store
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { useInfiniteMatches, useMyMatch } from '../../queries/useMatches'
import { ChallengeAPI } from '../../api/challengeApi'
import { queryClient } from '../../lib/queryClient'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useConfirm } from '../../queries/useMutation/useConfirm'
import MatchList from '../../component/matchcard/matchList/MatchList'





/**
 * Match Screen Component
 * Displays list of user's joined games and their status
 */
const Match = () => {
  const { isLight } = useThemeStore()
  const { user } = useAuthStore()
  const navigation = useNavigation()
  const { isConnected } = useNetworkStatus();
  // Derived list comes from the query; no local duplication
  const insets = useSafeAreaInsets();
  //============ Loading states ============  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutateAsync: confirmOpponent } = useConfirm();

  // Infinite query to fetch matches in pages of 5
  const {
    data: { flat: latestMatches = [], hasMore = false } = {},
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
    refreshFirstPage,
    error,
  } = useMyMatch(5);

  // Show offline message if there's a network error and no cached data
  if (error && !latestMatches.length && !isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top }]}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isLight ? "dark-content" : "light-content"}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: isLight ? '#000000' : '#ffffff' }]}>
            No internet connection
          </Text>
          <Text style={[styles.errorSubtext, { color: isLight ? '#666666' : '#999999' }]}>
            Please check your connection and try again
          </Text>
        </View>
      </View>
    );
  }


  const handleDeleteChallenge = useCallback(async (challengeId) => {
    try {
      await ChallengeAPI.deleteChallenge({ challenge_id: challengeId });
      await refetch();
      Toast.show('Challenge cancelled.', Toast.SHORT);
    } catch (error) {
      Toast.show(error?.message || 'Unable to cancel challenge', Toast.SHORT);
    }
  }, [refetch]);


  const handleIssue = useCallback((challenge_id, isCreator, game_name, game_mode, game) => {
    // Extract opponent information from game participants
    let opponent = null;
    
    if (game?.participants && game.participants.length > 0) {
      // Find the opponent (the participant who is not the current user)
      opponent = game.participants.find(participant => 
        participant.id !== user?.id && participant.participant_id !== user?.id
      );
    }

    // If no participants but we have creator info and current user is not creator
    if (!opponent && game?.created_by && game.created_by.id !== user?.id) {
      opponent = {
        id: game.created_by.id,
        full_name: game.created_by.full_name,
        name: game.created_by.full_name
      };
    }

    navigation.navigate('selectIssue', { 
      challenge_id, 
      isCreator, 
      game_name, 
      game_mode,
      opponent 
    });
  }, [navigation, user?.id]);




  //============ Handle Leave Challenge ============  
  const handleLeaveChallenge = useCallback(async (challengeId) => {
    try {
      await ChallengeAPI.leaveChallenge({ challenge_id: challengeId });
      await refetch();
      Toast.show('Challenge left.', Toast.SHORT);
    } catch (error) {
       Toast.show(error?.message || 'Unable to leave challenge', Toast.SHORT);
    }
  }, [refetch])



  // No effect needed; list derives directly from query data


  //============ Handle Send Game Credentials ==============================================================  

  const handleSendGameCredentials = async (credentials) => {
    try {

      const status = await ChallengeAPI.updateOnChallenge(credentials);

      return status;
    } catch (error) {
      Toast.show(error?.message || 'Failed to send credentials.', Toast.SHORT);
    }
  }

  //============================================================================================================





  //============================================================================================================

  const handleAcceptChallengeOnCopy = useCallback(async (payload) => {
    try {
      await ChallengeAPI.updateOnChallenge(payload);
    } catch (error) {
      return;
    }
  }, [])

  //============================================================================================================

  const handleConfirmedOpponent = async (participantId, gameId) => {
    const payload = {
      challenge_id: gameId,
      participant_id: participantId
    }
    try {
      await confirmOpponent(payload);
    } catch (error) {
      Toast.show(error?.message || "Failed to confirm opponent.", Toast.SHORT);
    }
  }

  //============================================================================================================





  //============ Handle Result Upload ============  
  const handleResultUpload = useCallback((game) => {
    navigation.navigate('resultUpload', { game })
  }, [navigation])



  //============ Handle Load More ============  
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isFetchingNextPage) {
      try {
        await fetchNextPage();
      } catch (error) {
        console.error('Failed to load more:', error);
      }
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);





  const handleRefresh = async () => {
    if (!isConnected) {
      Toast.show('No internet connection.', Toast.SHORT);
      return;
    }

    setIsRefreshing(true);

    try {
      queryClient.removeQueries({ queryKey: ["myMatch", 5] });
      await refetch();
    } catch (error) {
      Toast.show('Failed to refresh challenges. Please try again.', Toast.SHORT);
    } finally {
      setIsRefreshing(false);
    }
  };




  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#fefffe' : '#000000', paddingTop: insets.top }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      <MatchList
        games={latestMatches}
        isLoading={isRefreshing || isFetching && !isRefreshing && latestMatches.length === 0}
        handleSendGameCredentials={handleSendGameCredentials}
        handleAcceptChallengeOnCopy={handleAcceptChallengeOnCopy}
        handleResultUpload={handleResultUpload}
        handleDeleteChallenge={handleDeleteChallenge}
        isRefreshing={isRefreshing}
        isLoadingMore={isFetchingNextPage}
        hasMore={hasMore}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        handleConfirmedOpponent={handleConfirmedOpponent}
        handleLeaveChallenge={handleLeaveChallenge}
        handleIssue={handleIssue}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default React.memo(Match);