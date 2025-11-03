import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // Updated from cacheTime (deprecated)
      staleTime: 0,
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      // Global error handler to prevent crashes
      onError: (error) => {
        if (__DEV__) {
          console.error('Query error:', error);
        }
      },
    },
    mutations: {
      retry: 1, // Retry mutations once
      // Global error handler for mutations
      onError: (error) => {
        if (__DEV__) {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
