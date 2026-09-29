// src/components/common/Avatar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleProp, ViewStyle, ImageStyle, Platform } from 'react-native';
import { COLORS } from '../../theme';

const KINDR_LOGO = require('../../../assets/images/kindr-logo.png');

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showBorder?: boolean;
  borderColor?: string;
}

// Bảng màu pastel thân thiện cho chữ cái đại diện (Fallback Initials)
const PASTEL_PALETTES = [
  { bg: '#E8F5E9', text: '#2E7D32' }, // Mint pastel
  { bg: '#FFF3E0', text: '#E65100' }, // Peach pastel
  { bg: '#E3F2FD', text: '#1565C0' }, // Sky pastel
  { bg: '#FCE4EC', text: '#C2185B' }, // Rose pastel
  { bg: '#F3E5F5', text: '#7B1FA2' }, // Lavender pastel
  { bg: '#FFF8E1', text: '#F57F17' }, // Amber pastel
];

function getPaletteFromName(name: string) {
  if (!name) return PASTEL_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_PALETTES.length;
  return PASTEL_PALETTES[index];
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 38,
  style,
  imageStyle,
  showBorder = false,
  borderColor = COLORS.primary,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error status if uri changes
  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const radius = size / 2;
  const palette = getPaletteFromName(name);
  const initials = getInitials(name);
  const fontSize = Math.max(11, Math.round(size * 0.38));

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...(showBorder ? { borderWidth: 1.5, borderColor } : {}),
  };

  // Check valid URI string
  const isValidUri = typeof uri === 'string' && uri.trim().length > 0 && !hasError;

  if (isValidUri) {
    // Props for web to prevent 403 Forbidden from Google CDN (lh3.googleusercontent.com)
    const imageProps: any = {
      source: { uri: uri.trim() },
      style: [
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: COLORS.surfaceDim,
        },
        imageStyle,
      ],
      onError: () => {
        setHasError(true);
      },
      resizeMode: 'cover',
    };

    if (Platform.OS === 'web') {
      // React Native Web image element attribute
      imageProps.referrerPolicy = 'no-referrer';
    }

    return (
      <View style={[containerStyle, style]}>
        <Image {...imageProps} />
      </View>
    );
  }

  // Fallback: Display user Initials on warm pastel circle
  if (name && name.trim()) {
    return (
      <View style={[containerStyle, { backgroundColor: palette.bg }, style]}>
        <Text style={{ color: palette.text, fontSize, fontWeight: '700', letterSpacing: 0.2 }}>
          {initials}
        </Text>
      </View>
    );
  }

  // Final fallback: Kindr Logo Mascot
  return (
    <View style={[containerStyle, { backgroundColor: '#EBF8F5' }, style]}>
      <Image
        source={KINDR_LOGO}
        style={{ width: size * 0.8, height: size * 0.8 }}
        resizeMode="contain"
      />
    </View>
  );
};

export default Avatar;
