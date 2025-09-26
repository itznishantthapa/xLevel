import { registerRootComponent } from 'expo';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Silence deprecation warnings (optional)
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

//============ Background Message Handler ============
messaging().setBackgroundMessageHandler(async remoteMessage => {

});

//============ Register Root Component ============
registerRootComponent(App);
