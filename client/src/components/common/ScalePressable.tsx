import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  Platform,
} from 'react-native';

interface ScalePressableProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

/**
 * High-craftsmanship tactile pressable component.
 * Provides micro-spring physical feedback on press (Taste Design principle).
 */
export const ScalePressable: React.FC<ScalePressableProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  containerStyle,
  scaleTo = 0.96,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 25,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [
        containerStyle,
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer' } as any) : undefined,
      ]}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
