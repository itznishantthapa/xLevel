export default {
  presets: ['babel-preset-expo'],
  // IMPORTANT: Reanimated plugin must be last
  plugins: [
    'react-native-worklets/plugin',
    'react-native-reanimated/plugin',
  ],
};
  