import React from 'react'
import { StyleSheet, Text, View, Dimensions, StatusBar, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons, FontAwesome5, AntDesign, Entypo, Octicons, Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useThemeStore } from '../../../store/themeStore'

const { width, height } = Dimensions.get('window')

const Thanks = () => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()

  // Get route params to determine if this is an exchange or issue report
  const { type, enhancementTitle, enhancementPrice, enhancementType } = route.params || {}
  const isExchange = type === 'exchange'

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
    success: "#00bf63",
    warning: "#ff9500",
    premium: "#6366f1",
  }

  // Enhancement metadata for colors
  const enhancementColors = {
    pro_tag: colors.premium,
    hacker_tag: colors.warning,
    exposer: colors.success,
  }

  const getEnhancementColor = () => {
    return enhancementColors[enhancementType] || colors.success
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons 
            name="arrow-back" 
            size={24} 
            color={colors.text} 
          />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconWrapper, 
            { 
              backgroundColor: isExchange ? getEnhancementColor() : colors.cardBackground 
            }
          ]}>
            {isExchange ? (
               <Ionicons name="sparkles-sharp" size={32}  color="#ffffff" />
            ) : (
              <FontAwesome5 
                name="exclamation-circle" 
                size={32} 
                color={colors.text} 
              />
            )}
          </View>
        </View>

        {/* Thank You Message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isExchange ? 'Congratulations!' : 'Thank You!'}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isExchange 
              ? `Successfully exchanged ${enhancementTitle}!`
              : 'Your report has been submitted successfully'
            }
          </Text>
          
          {isExchange ? (
            <View style={styles.exchangeDetailsContainer}>
              <View style={[styles.exchangeCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.exchangeInfo}>
                  <Text style={[styles.exchangeTitle, { color: colors.text }]}>
                    {enhancementTitle}
                  </Text>
                  <Text style={[styles.exchangePrice, { color: getEnhancementColor() }]}>
                    {enhancementPrice} Points
                  </Text>
                </View>
                <View style={[styles.checkmarkBadge, { backgroundColor: getEnhancementColor() }]}>
                 <Entypo name="check" size={16} color={isLight ? "#ffffff" : "#000000"} />
                </View>
              </View>
              
              <View style={[styles.congratsMessage, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.congratsText, { color: colors.textSecondary }]}>
                  Your enhancement is now active and will be displayed across all your game profiles!
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.descriptionContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Our moderation team will review this report and take appropriate action within 24-48 hours.
              </Text>
            </View>
          )}
        </View>

        {/* Back instruction */}
        <View style={styles.backInstructionContainer}>
          <Text style={[styles.backInstructionText, { color: colors.textSecondary }]}>
            {isExchange 
              ? 'Your enhancement is now active!'
              : 'You have blocked the user. Refresh to update.'
            }
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Thanks

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  
  // Icon Section
  iconContainer: {
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Message Section
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionContainer: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 280,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Exchange Details Section
  exchangeDetailsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 4,
  },
  exchangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  exchangeInfo: {
    flex: 1,
  },
  exchangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exchangePrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkmarkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsMessage: {
    padding: 16,
    borderRadius: 12,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  congratsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Back Instruction Section
  backInstructionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backInstructionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
})