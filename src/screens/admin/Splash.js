import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const SplashScreen = () => {
 const navigation = useNavigation();

 useEffect(() => {
   const timer = setTimeout(() => {
     navigation.replace('dashboard'); // Navigate to Home after splash
   }, 4000); // 2 seconds delay
    return () => clearTimeout(timer); // Cleanup on unmount
    }
    , []);

  return (
        <>
            <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
            />
          
            <SafeAreaView style={{ flex: 1,backgroundColor:'white',position:'relative' }}>
              <Text style={styles.favTxt}>Admin</Text>
              <View style={styles.container}>
               <Text style={styles.text}>Admin SplashScreen</Text>
              </View>
            </SafeAreaView>

        </>
  )
}

export default SplashScreen

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
    borderRadius:10,
  }
})