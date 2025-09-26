import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

const Dashboard = () => {
  const navigation = useNavigation();
  return (
    <>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
            />

            <SafeAreaView style={{ flex: 1, backgroundColor: 'brown' }}>
              <Text style={styles.favTxt}>Admin Dashboard</Text>
              <View style={styles.container}>
                <Text style={styles.text} onPress={() => navigation.navigate('profile')}>Click</Text>
              </View>
            </SafeAreaView>

    </>
  )
}

export default Dashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favTxt: {
    color: '#ffffff'
  },
  text: {
    fontSize: 20,
    color: 'black',
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 10,
  }
})