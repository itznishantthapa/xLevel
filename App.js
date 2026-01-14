import { SafeAreaProvider } from 'react-native-safe-area-context';
import Main from './src/main/Main';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from './src/lib/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetProvider } from './src/context/BottomSheetContext';
import { StatusBar } from 'react-native';
import { useThemeStore } from './src/store/themeStore';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});


export default function App() {
  const { isLight } = useThemeStore()



  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
  });

  useEffect(() => {
    SystemNavigationBar.setNavigationColor(isLight ? '#ffffff' : '#000000', isLight ? 'dark' : 'light', 'navigation');
    // tell the window to apply system insets (status/nav) to the root view
    SystemNavigationBar.setFitsSystemWindows(true);
  }, [isLight]);

  return (
    <GestureHandlerRootView style={{ flex: 1,backgroundColor: isLight ? '#ffffff' : '#000000'}}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >

          <SafeAreaProvider style={{ flex: 1}}>
            <BottomSheetProvider >
              <Main />
            </BottomSheetProvider>
          </SafeAreaProvider>

        </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
