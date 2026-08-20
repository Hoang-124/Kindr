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
  icon?: React.ReactNode;
}

export const Input = ({
  label,
  error,
  containerStyle,
  inputStyle,
  icon,
  secureTextEntry,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry;
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focusedBorder,
        error ? styles.errorBorder : null
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <TextInput
          style={[styles.input, inputStyle]}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onBackground,
    marginBottom: SPACING.xs,
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
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 15,
  },
  iconContainer: {
    marginRight: SPACING.sm,
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
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
export default Input;
