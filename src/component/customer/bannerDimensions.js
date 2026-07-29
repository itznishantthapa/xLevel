import { spacing } from '../../theme/typography';

const BANNER_HORIZONTAL_PADDING = spacing.lg;
const BANNER_ASPECT_RATIO = 16 / 9;

/** Recommended Canva export size — matches on-screen 16:9 ratio at retina density */
export const BANNER_DESIGN_WIDTH = 1280;
export const BANNER_DESIGN_HEIGHT = 720;

export const getBannerDimensions = (screenWidth) => {
  const width = Math.round(screenWidth - BANNER_HORIZONTAL_PADDING * 2);
  const height = Math.round(width / BANNER_ASPECT_RATIO);
  return { width, height };
};
