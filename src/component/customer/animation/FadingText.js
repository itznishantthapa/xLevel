import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export const FadingText = ({ text, color }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000 }),
      -1,
      true // reverse (fade in/out)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: opacity.value };
  });

  return (
    <Animated.Text
      style={[{ color, fontSize: 14}, animatedStyle]}
    >
      {text}
    </Animated.Text>
  );
};