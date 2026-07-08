import React from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppIcon } from '../../components/common/AppIcon'
import { CheckmarkCircle01Icon, Notification01Icon, Settings01Icon } from '@hugeicons/core-free-icons'
import { iconSize } from '../../theme/typography'

const Dashboard = () => {
  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Hello Admin !</Text>
          </View>

          {/* Success Card */}
          <View style={styles.successCard}>
            <View style={styles.iconContainer}>
              <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.xl + 20} color="#00bf63" />
            </View>
            
            <Text style={styles.successTitle}>Logged In</Text>
            <Text style={styles.successMessage}>
              You have successfully logged in as admin and ready to receive admin notifications to your device.
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <AppIcon icon={Notification01Icon} size={iconSize.sm} color="#00bf63" />
                <Text style={styles.featureText}>Push Notifications Enabled</Text>
              </View>
              
              <View style={styles.featureItem}>
                <AppIcon icon={Settings01Icon} size={iconSize.sm} color="#00bf63" />
                <Text style={styles.featureText}>Admin Access Granted</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}

export default Dashboard

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  iconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
})