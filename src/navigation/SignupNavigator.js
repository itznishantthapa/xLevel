import { createStackNavigator } from '@react-navigation/stack';
import Auth from '../screens/signup/Auth';
import GameSelection from '../screens/signup/GameSelection';
import LegalDocument from '../screens/legal/LegalDocument';

const Stack = createStackNavigator();

export default function SignupNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="gameSelection"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        component={GameSelection}
        name="gameSelection"
        options={{ animation: 'fade' }}
      />
      <Stack.Screen component={Auth} name="auth" options={{ animation: 'fade' }} />
      <Stack.Screen component={LegalDocument} name="legalDocument" />
    </Stack.Navigator>
  );
}
