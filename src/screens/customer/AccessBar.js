import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, Pressable, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  AntDesign,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  SimpleLineIcons,
} from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useStatsPreferenceStore } from '../../store/statsPreference';
import { scaleWidth, scaleHeight } from '../../utils/scaling';
import AppHeader from './header/AppHeader';
 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AccessBar = ({ navigation }) => {
  const { isLight } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { 
    statsConfig, 
    toggleStatsItem, 
    reorderStatsItems, 
    getToggleableOptions 
  } = useStatsPreferenceStore();
  const [draggedIndex, setDraggedIndex] = useState(-1); // index currently being dragged
  const [isDragging, setIsDragging] = useState(false);

  const TOGGLEABLE_OPTIONS = getToggleableOptions();

  // Animation values for each item
  const animatedValues = useRef(
    statsConfig.map(() => ({
      translateX: useSharedValue(0),
      translateY: useSharedValue(0),
      scale: useSharedValue(1),
      zIndex: useSharedValue(0),
    }))
  ).current;

  // Keep animatedValues array length in sync with statsConfig (handles add/remove)
  useEffect(() => {
    // Add missing animated value objects
    if (animatedValues.length < statsConfig.length) {
      for (let i = animatedValues.length; i < statsConfig.length; i++) {
        animatedValues.push({
          translateX: useSharedValue(0),
          translateY: useSharedValue(0),
          scale: useSharedValue(1),
          zIndex: useSharedValue(0),
        });
      }
    }
    // If items were removed, truncate extra animated values
    if (animatedValues.length > statsConfig.length) {
      animatedValues.splice(statsConfig.length);
    }
  }, [statsConfig.length, animatedValues]);

  const handleToggle = (index) => {
    if (isDragging) return; // ignore taps while dragging
    toggleStatsItem(index);
  };

  /**
   * Long-press then horizontal drag to reorder.
   * Using activateAfterLongPress avoids conflicts with simple taps (for toggling)
   * and reduces risk of crashes in release caused by rapid state updates in quick tap detection.
   */
  const createPanGesture = (index) => {
    const H_THRESHOLD = scaleWidth(30); // px movement before considering reorder

    return Gesture.Pan()
      .activateAfterLongPress(160) // ms before pan activates (allows normal tap before this)
      .onStart(() => {
        runOnJS(setIsDragging)(true);
        runOnJS(setDraggedIndex)(index);
        animatedValues[index].scale.value = withSpring(1.08);
        animatedValues[index].zIndex.value = 10;
      })
      .onUpdate((e) => {
        // Only horizontal translation matters for reordering
        animatedValues[index].translateX.value = e.translationX;
      })
      .onEnd((e) => {
        const dragX = e.translationX;
        let targetIndex = index;

        if (Math.abs(dragX) > H_THRESHOLD) {
          // Move one slot left/right per gesture end (simple + predictable)
            if (dragX > 0 && index < statsConfig.length - 1) targetIndex = index + 1;
            if (dragX < 0 && index > 0) targetIndex = index - 1;
        }

        if (targetIndex !== index) {
          runOnJS(reorderStatsItems)(index, targetIndex);
        }

        // Reset animation values
        animatedValues[index].translateX.value = withSpring(0);
        animatedValues[index].scale.value = withSpring(1);
        animatedValues[index].zIndex.value = 0;
        runOnJS(setIsDragging)(false);
        runOnJS(setDraggedIndex)(-1);
      })
      .onFinalize(() => {
        // Ensure cleanup even if gesture cancels
        animatedValues[index].translateX.value = withSpring(0);
        animatedValues[index].scale.value = withSpring(1);
        animatedValues[index].zIndex.value = 0;
        runOnJS(setIsDragging)(false);
        runOnJS(setDraggedIndex)(-1);
      });
  };



  const renderIcon = (item, color, size = 30) => {
    const IconComponent = {
      Ionicons,
      MaterialIcons,
      SimpleLineIcons,
      MaterialCommunityIcons,
      AntDesign,
      FontAwesome5,
      FontAwesome6,
    }[item.iconLib];

    return <IconComponent name={item.icon} size={size} color={color} />;
  };

  const renderStatItem = (item, index) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: animatedValues[index].translateX.value },
        { translateY: animatedValues[index].translateY.value },
        { scale: animatedValues[index].scale.value },
      ],
      zIndex: animatedValues[index].zIndex.value,
    }));

    const isToggleable = TOGGLEABLE_OPTIONS[item.type];
    const color = isLight ? '#333333' : '#EAEAEA';

    return (
      <GestureDetector key={item.id} gesture={createPanGesture(index)}>
        <Animated.View style={[styles.statItem, animatedStyle]}>
          <Pressable
            style={[
              styles.statItemContent,
              isToggleable && styles.toggleableItem,
              isToggleable && { borderWidth: 1, borderColor: color, borderRadius: scaleWidth(8), opacity: 0.8 }
            ]}
                        onPress={() => handleToggle(index)}

          >
            {renderIcon(item, color)}
            <Text style={[styles.statLabel, { color }]}>{item.name}</Text>
            {isToggleable && (
              <View style={[styles.toggleIndicator, { backgroundColor: color }]} />
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: isLight ? '#ffffff' : '#000000',
      paddingTop: insets.top,
      paddingBottom: insets.bottom 
    }]}>
      <AppHeader 
        backButton={true} 
        title="AccessBar" 
      />

      <View style={styles.content}>
        <Text style={[styles.description, { color: isLight ? '#666666' : '#CCCCCC' }]}>
          Personalize your accessbar by dragging to reorder and tapping to toggle options.
        </Text>

        {/* Top Centered Stats Preview */}
        <View style={styles.topCenterContainer}>
          <View style={styles.statsPreview}>
            <View style={[
              styles.statsContainer,
              { borderColor: isLight ? '#333333' : '#EAEAEA' }
            ]}>
              {statsConfig.map((item, index) => (
                <React.Fragment key={item.id}>
                  {renderStatItem(item, index)}
                  {index < statsConfig.length - 1 && (
                    <View style={styles.statDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <View style={styles.instructionRow}>
            <MaterialCommunityIcons 
              name="drag" 
              size={scaleWidth(20)} 
              color={isLight ? '#666666' : '#CCCCCC'} 
            />
            <Text style={[styles.instructionText, { color: isLight ? '#666666' : '#CCCCCC' }]}>
              Hold & Drag to change position
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <MaterialIcons 
              name="touch-app" 
              size={scaleWidth(20)} 
              color={isLight ? '#666666' : '#CCCCCC'} 
            />
            <Text style={[styles.instructionText, { color: isLight ? '#666666' : '#CCCCCC' }]}>
              Tap to toggle options
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AccessBar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    // paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(20),
  },
  description: {
    fontSize: scaleWidth(14),
    textAlign: 'center',
    marginBottom: scaleHeight(30),
    lineHeight: scaleHeight(20),
  },
  topCenterContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(20),
  },
  statsPreview: {
    alignItems: 'center',
    marginVertical: scaleHeight(20),
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginTop: 10,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    paddingVertical: 15,
    borderWidth: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemContent: {
    alignItems: 'center',
    padding: scaleWidth(8),
    minHeight: 60,
    justifyContent: 'center',
  },
  toggleableItem: {
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    top: scaleHeight(2),
    right: scaleWidth(2),
    width: scaleWidth(6),
    height: scaleHeight(6),
    borderRadius: scaleWidth(3),
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: scaleHeight(4),
  },
  statDivider: {
    width: 2,
    backgroundColor: 'grey',
    marginVertical: 5,
    borderRadius: 1.5,
  },
  instructions: {
    alignItems: 'center',
    gap: scaleHeight(15),
    position: 'absolute',
    bottom: scaleHeight(40),
    left: 0,
    right: 0,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  instructionText: {
    fontSize: scaleWidth(14),
    fontWeight: '500',
  },
});