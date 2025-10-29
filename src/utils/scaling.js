import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (from your design's screen size)
const BASE_WIDTH = 450;
const BASE_HEIGHT = 1005;

// Scaling functions
export const scaleWidth = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const scaleHeight = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;


