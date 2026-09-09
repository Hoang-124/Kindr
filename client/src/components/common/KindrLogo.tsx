// src/components/common/KindrLogo.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';

const LOGO_IMAGE = require('../../../assets/images/kindr-logo.png');

interface KindrLogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  layout?: 'vertical' | 'horizontal';
  style?: ViewStyle;
}

export const KindrLogo: React.FC<KindrLogoProps> = ({
  size = 80,
  showWordmark = true,
  tagline,
  layout = 'vertical',
  style,
}) => {
  const isHorizontal = layout === 'horizontal';

  return (
    <View style={[styles.container, isHorizontal && styles.containerHorizontal, style]}>
      <View style={[styles.logoWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image 
          source={LOGO_IMAGE} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
          resizeMode="cover"
        />
      </View>
      
      {showWordmark && (
        <View style={[styles.textWrapper, isHorizontal && styles.textWrapperHorizontal]}>
          <Text style={[styles.brandText, isHorizontal && styles.brandTextHorizontal]}>
            Kindr
          </Text>
          {tagline && (
            <Text style={styles.taglineText}>
              {tagline}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#D4EBE3',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  textWrapperHorizontal: {
    alignItems: 'flex-start',
    marginTop: 0,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0ABAB5',
    letterSpacing: -0.5,
  },
  brandTextHorizontal: {
    fontSize: 22,
  },
  taglineText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
});

export default KindrLogo;
