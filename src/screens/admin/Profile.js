import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

const Profile = () => {
  const navigation = useNavigation();
  return (
        <>
            <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
            />
          
            <SafeAreaView style={{ flex: 1,backgroundColor:'blue' }}>
              <Text style={styles.favTxt}>Admin Profile</Text>
              <View style={styles.container}>
               <Text style={styles.text} onPress={()=>navigation.navigate('dashboard')}>Click</Text>
              </View>
            </SafeAreaView>

        </>
  )
}

export default Profile

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
  },
  favTxt:{
    color:'#ffffff'
  },
  text:{
    fontSize:20,
    color:'black',
    padding:10,
    backgroundColor:'red',
    borderRadius:10,
  }
})