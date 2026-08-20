// client/src/components/common/FadeInItem.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeInItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Staggered fade-in & slide-up animation container for cards and lists.
 */
export const FadeInItem: React.FC<FadeInItemProps> = ({
  children,
  index = 0,
  delay = 50,
  duration = 350,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const totalDelay = Math.min(index * delay, 400); // cap max delay at 400ms

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration,
        delay: totalDelay,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        delay: totalDelay,
        speed: 18,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, duration, opacityAnim, translateYAnim]);

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
