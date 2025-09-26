import { createStackNavigator } from "@react-navigation/stack";
import Dashboard from "../screens/admin/Dashboard";
import Profile from "../screens/admin/Profile";
import SplashScreen from "../screens/admin/Splash";
const Stack = createStackNavigator();


export default function AdminNavigator(){
    return(
        <>
          <Stack.Navigator screenOptions={{headerShown:false,animation:'slide_from_right'}}>
            <Stack.Screen component={SplashScreen} name="splash"/>
            <Stack.Screen component={Dashboard} name="dashboard"/>
            <Stack.Screen component={Profile} name="profile"/>
          </Stack.Navigator>
        </>
    );
}