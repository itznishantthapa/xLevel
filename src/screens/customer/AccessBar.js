import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,

} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
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
  const [draggedIndex, setDraggedIndex] = useState(-1);
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

  // Update animation values when statsConfig changes
  useEffect(() => {
    if (animatedValues.length !== statsConfig.length) {
      // Recreate animatedValues array if the length changed
      for (let i = animatedValues.length; i < statsConfig.length; i++) {
        animatedValues.push({
          translateX: useSharedValue(0),
          translateY: useSharedValue(0),
          scale: useSharedValue(1),
          zIndex: useSharedValue(0),
        });
      }
    }
  }, [statsConfig.length]);

  const handleToggle = (index) => {
    if (isDragging) return;
    toggleStatsItem(index);
  };

  // Modern gesture handler using Gesture.Pan
  const createPanGesture = (index) => {
    let startTime = 0;
    
    return Gesture.Pan()
      .onBegin(() => {
        startTime = Date.now();
      })
      .onStart(() => {
        runOnJS(setIsDragging)(true);
        runOnJS(setDraggedIndex)(index);
        animatedValues[index].scale.value = withSpring(1.1);
        animatedValues[index].zIndex.value = 999;
      })
      .onUpdate((event) => {
        animatedValues[index].translateX.value = event.translationX;
        animatedValues[index].translateY.value = event.translationY;
      })
      .onEnd((event) => {
        const duration = Date.now() - startTime;
        const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
        
        // If it's a quick tap (less than 200ms and less than 10px movement), treat as toggle
        if (duration < 200 && distance < 10) {
          runOnJS(handleToggle)(index);
        } else {
          // Otherwise treat as drag reorder
          const itemWidth = (SCREEN_WIDTH - 60) / 4;
          const threshold = itemWidth / 2;
          let targetIndex = index;
          const dragDistance = event.translationX;
          if (Math.abs(dragDistance) > threshold) {
            if (dragDistance > 0 && index < statsConfig.length - 1) {
              targetIndex = index + 1;
            } else if (dragDistance < 0 && index > 0) {
              targetIndex = index - 1;
            }
          }
          if (targetIndex !== index) {
            runOnJS(reorderStatsItems)(index, targetIndex);
          }
        }
        
        animatedValues[index].translateX.value = withSpring(0);
        animatedValues[index].translateY.value = withSpring(0);
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
              isToggleable && { borderWidth: 1, borderColor: color, borderRadius: 8, opacity: 0.8 }
            ]}
                        onPress={() => handleToggle(index)}

          >
            {renderIcon(item, color)}
            <Text style={[styles.statLabel, { color }]}> 
              {item.name}
            </Text>
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
              size={20} 
              color={isLight ? '#666666' : '#CCCCCC'} 
            />
            <Text style={[styles.instructionText, { color: isLight ? '#666666' : '#CCCCCC' }]}>
              Drag to change position
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <MaterialIcons 
              name="touch-app" 
              size={20} 
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  topCenterContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statsPreview: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 15,
    paddingVertical: 15,
    borderWidth: 1,
    width: SCREEN_WIDTH - 40,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemContent: {
    alignItems: 'center',
    padding: 8,
    minHeight: 60,
    justifyContent: 'center',
  },
  toggleableItem: {
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'grey',
    marginVertical: 5,
  },
  instructions: {
    alignItems: 'center',
    gap: 15,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});