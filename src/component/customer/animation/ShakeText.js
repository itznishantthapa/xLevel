import React, { useCallback, useImperativeHandle, forwardRef } from 'react'
import { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

const ShakeText = forwardRef(({ children, style, intensity = 8, duration = 50 }, ref) => {
  const shakeOffset = useSharedValue(0)

  const shake = useCallback(() => {
    'worklet'
    shakeOffset.value = withSequence(
      withTiming(intensity, { duration }),
      withTiming(-intensity, { duration }),
      withTiming(intensity, { duration }),
      withTiming(-intensity, { duration }),
      withTiming(0, { duration })
    )
  }, [shakeOffset, intensity, duration])

  // Expose shake function to parent component
  useImperativeHandle(ref, () => ({
    shake
  }), [shake])

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }))

  return (
    <Animated.View style={[style, shakeAnimatedStyle]}>
      {children}
    </Animated.View>
  )
})

ShakeText.displayName = 'ShakeText'

export default ShakeText