import { createStackNavigator } from "@react-navigation/stack";
import Dashboard from "../screens/admin/Dashboard";
const Stack = createStackNavigator();

export default function AdminNavigator(){
    return(
        <>
          <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName="dashboard">
            <Stack.Screen component={Dashboard} name="dashboard"/>
          </Stack.Navigator>
        </>
    );
}