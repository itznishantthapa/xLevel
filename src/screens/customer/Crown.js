import { StatusBar, StyleSheet, Text, View, Image, ScrollView, Pressable, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { Ionicons , MaterialCommunityIcons} from "@expo/vector-icons"
import CoolButton from '../../component/customer/common/CoolButton';


const Crown = () => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const insets = useSafeAreaInsets();

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "#555555" : "#999999",
    sectionTitle: isLight ? "#333333" : "#cccccc",
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.container, { 
        backgroundColor: colors.background,
        paddingBottom: insets.bottom ,
      }]}>
        {/* Full-width header with wallet-style curve */}
        <View style={styles.headerContainer}>
          {/* Main header content */}
          <View style={[styles.headerContent, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : insets.top}]}>
             {
              Platform.OS === 'ios' && (
              <Pressable style={{ alignSelf: 'flex-start', marginLeft: 10 }} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={25} color={'white'} />
              </Pressable>)
            }
            <View style={styles.logoContainerInner}>
              {/* Left Crown with Animation Effect */}
              <View style={styles.crownWrapper}>
                <View style={styles.crownGlow}>
                  <MaterialCommunityIcons name="crown" size={65} color="#00C851" style={styles.crownLeft} />
                </View>
              </View>
              
              {/* Logo with Enhanced Styling */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/xKick.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.tagline}>Level Up Your Gaming Wallet</Text>
                <View style={styles.taglineUnderline} />
              </View>
              
              {/* Right Crown with Animation Effect */}
              <View style={styles.crownWrapper}>
                <View style={styles.crownGlow}>
                  <MaterialCommunityIcons name="crown" size={65} color="#00C851" style={styles.crownRight} />
                </View>
              </View>
            </View>
          </View>
          
          {/* Curved bottom edge */}
          <View style={styles.curveContainer}>
            <View style={[styles.curve, { backgroundColor: colors.background }]} />
          </View>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Rules Section */}
          <View style={styles.rulesContainer}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Crown Rules & Payment Guide</Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Crown System</Text>
              <View style={styles.line} />
              <Text style={[styles.text, { color: colors.textSecondary }]}>Crown Rate: 1 Crown = NPR 1</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>(e.g., NPR 100 = 100 Crowns)</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>Minimum Purchase: NPR 10</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>Maximun Purchase: NPR 10,000</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>Crown Credit Time: Crowns are credited within 10 minutes after payment verification.</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Withdrawal:</Text>
              <View style={styles.line} />
              <Text style={[styles.text, { color: colors.textSecondary }]}>You can withdraw crowns as money anytime.</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>Minimum withdrawal amount: 100 Crowns (i.e., NPR 100)</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>Maximum withdrawal amount: 10,000 Crowns (i.e., NPR 10,000)</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Payment Steps</Text>
              <View style={styles.line} />
              <Text style={[styles.text, { color: colors.textSecondary }]}>1. Scan & Pay the amount to the QR Code using digital wallets (Remarks: Your Full Name).</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>2. Enter the amount of transaction you've done.</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>3. Upload the transaction screenshot.</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>4. Once verified, crowns will be credited to your account within 10 minutes.</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Proceed Button */}
        <View style={styles.footer}>
          <CoolButton handlePress={() => navigation.navigate('scanPay')} title={'Proceed'} />
        </View>
      </View>
    </>
  )
}

export default Crown

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#000000',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  curveContainer: {
    height: 50,
    overflow: 'hidden',
    marginTop: -1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  curve: {
    height: 30,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 1,
    borderColor: '#00C851',
    borderBottomWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  logoContainerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  crownWrapper: {
    padding: 5,
  },
  crownGlow: {
    // Removed glow effect
  },
  crownLeft: {
    transform: [{ rotate: '-15deg' }],
  },
  crownRight: {
    transform: [{ rotate: '15deg' }],
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  logo: {
    width: 160,
    height: 90,
    marginBottom: 5,
  },
  tagline: {
    color: '#00C851',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 4,
  },
  taglineUnderline: {
    width: 80,
    height: 2,
    backgroundColor: '#00C851',
    marginTop: 2,
  },

  rulesContainer: {
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  line: {
    height: 1,
    backgroundColor: '#00C851',
    marginBottom: 10,
    width: '40%',
    borderWidth: 1,
    borderColor: '#00C851',
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  proceedButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 0,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

