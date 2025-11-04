export default {
  presets: ['babel-preset-expo'],
  // IMPORTANT: Worklets/Reanimated plugin must be last
  // Reanimated v4 moved its Babel plugin to "react-native-worklets/plugin"
  plugins: [
    'react-native-worklets/plugin',
  ],
};
  