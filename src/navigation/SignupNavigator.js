import { createStackNavigator } from "@react-navigation/stack";
import Auth from "../screens/signup/Auth";
import LegalDocument from "../screens/legal/LegalDocument";

const Stack = createStackNavigator();

export default function SignupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen component={Auth} name="auth" options={{ animation: 'fade' }} />
      <Stack.Screen component={LegalDocument} name="legalDocument" />
    </Stack.Navigator>
  );
}
