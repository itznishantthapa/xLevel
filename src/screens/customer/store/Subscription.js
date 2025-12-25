import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ImageBackground,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AntDesign } from '@expo/vector-icons'
import { useThemeStore } from '../../../store/themeStore'

const { width } = Dimensions.get('window')

// Card dimensions with 2.4:1 aspect ratio for consistent Canva designs
// Design your Canva images at 1200x500px (2.4:1 ratio) for best results
const CARD_WIDTH = width - 32
const CARD_HEIGHT = CARD_WIDTH / 2.4

// Mocked subscription categories data
const SUBSCRIPTION_CATEGORIES = [
  {
    id: '1',
    title: 'Free Fire Topup & Subscriptions',
    bgImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  },
  {
    id: '2',
    title: 'OTT Subscriptions',
    bgImage: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80',
  },
  {
    id: '3',
    title: 'PUBG Topups & Subscriptions',
    bgImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
  },
  {
    id: '4',
    title: 'Popular Tools Subscriptions',
    bgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
]

const SubscriptionCard = ({ item, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(item)}
    >
      <ImageBackground
        source={require('../../../assets/bgForSubscriptions.png')}
        style={styles.cardBackground}
        imageStyle={styles.cardImageStyle}
        resizeMode="cover"
      />
    </Pressable>
  )
}

const SubscriptionHeader = ({ isLight }) => (
  <View style={styles.header}>
    <View>
      <Text style={[styles.headerTitle, { color: isLight ? '#000' : '#fff' }]}>
        Subscriptions
      </Text>
      <View style={[styles.headingUnderline, { backgroundColor: isLight ? '#000000' : '#ffffff' }]} />
    </View>
  </View>
)

const SubscriptionFooter = ({ isLight }) => (
  <View style={styles.footer}>
    <AntDesign
      name="dingding"
      size={20}
      color={isLight ? '#666666' : 'rgba(255, 255, 255, 0.6)'}
    />
    <Text style={[styles.footerText, { color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.6)' }]}>
     Contact Us For Other Subscription & Topups
    </Text>
    <AntDesign
      name="dingding"
      size={20}
      color={isLight ? '#666666' : 'rgba(255, 255, 255, 0.6)'}
      style={{ transform: [{ scaleX: -1 }] }}
    />
  </View>
)

const Subscription = () => {
  const { isLight } = useThemeStore()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const handleCategoryPress = (category) => {
    // TODO: Navigate to category details
    console.log('Category pressed:', category.id, category.title)
  }

  const renderItem = ({ item }) => (
    <SubscriptionCard
      item={item}
      onPress={handleCategoryPress}
    />
  )

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? '#ffffff' : '#000000', paddingTop: insets.top },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />

      <SubscriptionHeader isLight={isLight} />

      <FlatList
        data={SUBSCRIPTION_CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListFooterComponent={<SubscriptionFooter isLight={isLight} />}
      />
    </View>
  )
}

export default Subscription

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headingUnderline: {
    width: 80,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  cardBackground: {
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
})
