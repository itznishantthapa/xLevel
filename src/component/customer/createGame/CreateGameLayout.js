import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Loader from '../../Loader';
import CoolButton from '../common/CoolButton';
import AppHeader from '../../../screens/customer/header/AppHeader';

/**
 * CreateGameLayout - Shared layout wrapper for all game creation screens
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the layout
 * @param {string} props.title - Header title
 * @param {boolean} props.isLight - Light mode state
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isFormValid - Whether the form is valid for submission
 * @param {function} props.onSubmit - Function to call when form is submitted
 * @param {Object} props.scrollViewRef - Ref for the ScrollView (for keyboard handling)
 * @param {boolean} props.keyboardVisible - Whether keyboard is visible
 * @param {string} props.buttonTitle - Title for the submit button (default: "Create Match")
 * @param {string} props.loaderMessage - Message for the loader (default: "Creating match...")
 * @returns {JSX.Element}
 */
const CreateGameLayout = ({ 
  children, 
  title, 
  isLight, 
  isLoading,
  onSubmit, 
  scrollViewRef, 
  keyboardVisible,
  buttonTitle = "Create Match",
  loaderMessage = "Creating match..."
}) => {
  return (
    <View style={[styles.mainContainer, { backgroundColor: isLight ? "#ffffff" : "#000000" }]}>
      <Loader visible={isLoading} message={loaderMessage} size={50} />
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />

      <SafeAreaView style={styles.safeArea}>
        <AppHeader backButton={true} title={title} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={keyboardVisible && { paddingBottom: 300 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.gameCard, { 
            backgroundColor: isLight ? "#ffffff" : "#000000",
            borderColor: isLight ? "#333333" : "#dadada",
            borderWidth: 1,
            marginHorizontal: -1.5
          }]}>
            {children}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <CoolButton title={buttonTitle} handlePress={onSubmit} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 0,
  },
  gameCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    marginBottom: 20,
  }
});

export default CreateGameLayout;
