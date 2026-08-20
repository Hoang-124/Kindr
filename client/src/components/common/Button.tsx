// src/components/common/Button.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TextStyle, 
  ViewStyle, 
  GestureResponderEvent 
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'error' | 'disabled';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

import { ScalePressable } from './ScalePressable';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  disabled = false,
}: ButtonProps) => {
  const isButtonDisabled = disabled || loading || variant === 'disabled';

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'error':
        return styles.error;
      case 'disabled':
        return styles.disabled;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      case 'disabled':
        return styles.textDisabled;
      default:
        return styles.textWhite;
    }
  };

  return (
    <ScalePressable
      onPress={onPress}
      disabled={isButtonDisabled}
      scaleTo={0.96}
      style={[styles.button, getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? COLORS.primary : COLORS.onPrimary} 
          size="small" 
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  secondary: {
    backgroundColor: COLORS.secondaryContainer,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  error: {
    backgroundColor: COLORS.error,
  },
  disabled: {
    backgroundColor: COLORS.outlineVariant,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textWhite: {
    color: COLORS.onPrimary,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: COLORS.outline,
  },
});
export default Button;
