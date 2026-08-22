// src/components/common/Input.tsx
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps,
  TouchableOpacity
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  icon?: React.ReactNode;
  compact?: boolean;
}

export const Input = ({
  label,
  error,
  containerStyle,
  inputStyle,
  inputContainerStyle,
  icon,
  secureTextEntry,
  compact = false,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry;
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, compact && styles.compactContainer, containerStyle]}>
      {label && <Text style={[styles.label, compact && styles.compactLabel]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        compact && styles.compactInputContainer,
        inputContainerStyle,
        isFocused && styles.focusedBorder,
        error ? styles.errorBorder : null
      ]}>
        {icon && <View style={[styles.iconContainer, compact && styles.compactIconContainer]}>{icon}</View>}
        
        <TextInput
          style={[styles.input, compact && styles.compactInput, inputStyle]}
          placeholderTextColor={COLORS.outline}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showPasswordToggle && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.toggleContainer}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={COLORS.outline} />
            ) : (
              <Eye size={20} color={COLORS.outline} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  compactContainer: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onBackground,
    marginBottom: SPACING.xs,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: COLORS.onSurfaceVariant,
  },
  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.default,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  compactInputContainer: {
    height: 38,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 15,
    minWidth: 0,
  },
  compactInput: {
    fontSize: 12,
    paddingVertical: 0,
    minWidth: 0,
  },
  iconContainer: {
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  compactIconContainer: {
    marginRight: 4,
    flexShrink: 0,
  },
  focusedBorder: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  toggleContainer: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: 2,
  },
});
export default Input;
