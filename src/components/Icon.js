import React from 'react';
import {Lucide} from '@react-native-vector-icons/lucide';

/**
 * Central Smaran icon component.
 *
 * We keep all icon usage behind this component so the rest
 * of the application doesn't need to know which icon library
 * is being used.
 *
 * This also makes it much easier to replace or update the
 * icon family later without modifying every screen.
 */

export default function Icon({
  name,
  size = 24,
  color = '#1F4D3F',
  strokeWidth = 2,
  ...props
}) {
  return (
    <Lucide
      name={name}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}