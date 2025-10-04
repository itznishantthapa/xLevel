import { View, Text, StyleSheet, StatusBar, Pressable } from "react-native"
import { __DEV__ } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { useMemo } from "react"
import AppHeader from '../../../screens/customer/header/AppHeader'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Socials removed per minimal requirement

const AppErrorFallback = ({ error, resetErrorBoundary }) => {
  const insets = useSafeAreaInsets();
  const { isLight } = useThemeStore()
  // Only reset boundary (no navigation back)
  const handleReset = () => {
    resetErrorBoundary();
  }

  const { themeStyles } = useMemo(() => {
    const textColor = isLight ? '#000' : '#fff'
    return {
      themeStyles: {
        textColor,
        surface: isLight ? '#ffffff' : '#000000',
        subtle: isLight ? '#e6e6e6' : '#1a1a1a',
        iconColor: textColor,
        buttonBg: isLight ? '#000' : '#fff',
        buttonText: isLight ? '#fff' : '#000'
      }
    }
  }, [isLight])

  return (
    
    <Pressable style={[styles.screen, { backgroundColor: themeStyles.surface, paddingTop: insets.top }]} onPress={handleReset} >
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />
      <AppHeader backButton={false} title={'Unable to Load'} />
      <View style={styles.centerWrap}>
        <View accessibilityRole="button" accessibilityLabel="Reset screen" style={styles.tapBox}>
          <Text style={[styles.simpleMsg, { color: themeStyles.textColor }]}>Something went wrong. Tap to retry.</Text>
        </View>
        {__DEV__ && (
          <Text style={[styles.devHint, { color: themeStyles.textColor }]}>{error?.message}</Text>
        )}
      </View>
    </Pressable>
  )
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  tapBox: { paddingVertical: 12, paddingHorizontal: 16 },
  simpleMsg: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  devHint: { marginTop: 4, fontSize: 11, opacity: 0.7, textAlign: 'center' },
})

export default AppErrorFallback