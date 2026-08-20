// src/components/common/CustomAlert.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

type AlertCallbackType = (config: AlertConfig) => void;
let globalAlertCallback: AlertCallbackType | null = null;

export const triggerCustomAlert = (config: AlertConfig) => {
  if (globalAlertCallback) {
    globalAlertCallback(config);
  }
};

export const CustomAlertProvider = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    globalAlertCallback = (newConfig: AlertConfig) => {
      setConfig(newConfig);
      setVisible(true);
    };
    return () => {
      globalAlertCallback = null;
    };
  }, []);

  if (!visible || !config) return null;

  const handleButtonPress = (onPress?: () => void) => {
    setVisible(false);
    if (onPress) {
      onPress();
    }
  };

  const buttons = config.buttons || [{ text: 'OK' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>{config.title}</Text>
              {config.message ? (
                <Text style={styles.description}>{config.message}</Text>
              ) : null}
              
              <View style={[
                styles.buttonContainer, 
                buttons.length > 2 && styles.buttonContainerVertical
              ]}>
                {buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel' || btn.text === 'Hủy' || btn.text === 'Cancel' || btn.text === 'Đóng';
                  const isDestructive = btn.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleButtonPress(btn.onPress)}
                      style={[
                        styles.button,
                        isCancel ? styles.cancelBtn : styles.confirmBtn,
                        isDestructive && styles.destructiveBtn,
                        buttons.length > 2 && styles.buttonFullWidth
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.buttonText,
                        isCancel ? styles.cancelText : styles.confirmText,
                        isDestructive && styles.destructiveText
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 26, 17, 0.4)', // Muted warm dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.ambient,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onBackground,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  buttonFullWidth: {
    width: '100%',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelBtn: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  destructiveBtn: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmText: {
    color: '#ffffff',
  },
  cancelText: {
    color: COLORS.onSurfaceVariant,
  },
  destructiveText: {
    color: '#ffffff',
  },
});

export default CustomAlertProvider;
