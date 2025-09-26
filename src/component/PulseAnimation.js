import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const PulseAnimation = ({ size = 10, color = '#00C851', duration = 1200 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);

  const containerSize = size;
  const circleStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
    backgroundColor: color,
  };

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulse,
          circleStyle,
          {
            transform: [
              {
                scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] })
              }
            ],
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] })
          },
        ]}
      />
      <View style={[styles.core, circleStyle]} />
    </View>
  );
};

export default PulseAnimation;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  core: {
    position: 'absolute',
  },
});

