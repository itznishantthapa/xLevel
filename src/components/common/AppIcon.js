import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StarsIcon } from '@hugeicons/core-free-icons';
import { iconSize } from '../../theme/typography';

/**
 * App-wide Hugeicons wrapper.
 * Use PointsIcon for wallet / game points / currency.
 */
export function AppIcon({
  icon,
  size = iconSize.md,
  color = '#000000',
  strokeWidth = 1.75,
  style,
  ...props
}) {
  if (!icon) return null;

  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      {...props}
    />
  );
}

export function PointsIcon(props) {
  return <AppIcon icon={StarsIcon} {...props} />;
}

export default AppIcon;
