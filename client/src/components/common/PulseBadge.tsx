// client/src/components/common/PulseBadge.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface PulseBadgeProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleMin?: number;
  scaleMax?: number;
  duration?: number;
}

/**
 * Living pulse badge with smooth breathing animation.
 * Emphasizes high-trust status (Double Escrow, 6h Safeful Time).
 */
export const PulseBadge: React.FC<PulseBadgeProps> = ({
  children,
  style,
  scaleMin = 1.0,
  scaleMax = 1.04,
  duration = 2000,
}) => {
  const pulseAnim = useRef(new Animated.Value(scaleMin)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: scaleMax,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: scaleMin,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, scaleMin, scaleMax, duration]);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};
