// src/components/layout/Card.tsx
import React, { ReactNode } from 'react';
import { 
  StyleSheet, 
  View, 
  ViewStyle, 
  TouchableOpacity 
} from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Card = ({ children, onPress, style, contentStyle }: CardProps) => {
  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9} 
        style={[styles.card, style]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  content: {
    padding: SPACING.md,
  },
});
export default Card;
