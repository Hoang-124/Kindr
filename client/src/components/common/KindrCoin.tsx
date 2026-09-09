// src/components/common/KindrCoin.tsx
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface KindrCoinProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * KindrCoin - Vector SVG coin replacing unicode emoji 🪙
 * Features royal golden gradient, 3D embossed outer rim, and Kindr 'K' emblem.
 */
export const KindrCoin: React.FC<KindrCoinProps> = ({ size = 18, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          {/* Outer edge gradient */}
          <LinearGradient id="coinOuterGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>

          {/* 3D Rim bevel */}
          <LinearGradient id="coinRimGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#92400E" stopOpacity="0.8" />
          </LinearGradient>

          {/* Inner face gradient */}
          <LinearGradient id="coinFaceGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE68A" />
            <Stop offset="60%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>

          {/* Emblem highlight */}
          <LinearGradient id="coinEmblemGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FEF08A" />
          </LinearGradient>
        </Defs>

        {/* 1. Base shadow / outer disc */}
        <Circle cx="20" cy="20" r="19" fill="url(#coinOuterGrad)" stroke="#B45309" strokeWidth="0.8" />

        {/* 2. Concentric Bevel Rim */}
        <Circle cx="20" cy="20" r="16.5" fill="none" stroke="url(#coinRimGrad)" strokeWidth="1.8" />

        {/* 3. Coin Inner Face */}
        <Circle cx="20" cy="20" r="15" fill="url(#coinFaceGrad)" />

        {/* 4. Beaded coin rim dots (4 cardinal dots for coin currency realism) */}
        <Circle cx="20" cy="6.5" r="0.9" fill="#FEF3C7" />
        <Circle cx="33.5" cy="20" r="0.9" fill="#92400E" opacity="0.6" />
        <Circle cx="20" cy="33.5" r="0.9" fill="#92400E" opacity="0.7" />
        <Circle cx="6.5" cy="20" r="0.9" fill="#FEF3C7" />

        {/* 5. Embossed Drop Shadow for 'K' Emblem */}
        <Path
          d="M 13.5 11.5 H 17 V 28.5 H 13.5 Z M 21 20 L 26.5 11.5 H 22.5 L 17 20 L 23 28.5 H 27 Z"
          fill="#92400E"
          opacity="0.45"
        />

        {/* 6. Stamped Kindr 'K' Emblem in Shiny Gold/White */}
        <Path
          d="M 13 11 H 16.5 V 28 H 13 Z M 20.5 19.5 L 26 11 H 22 L 16.5 19.5 L 22.5 28 H 26.5 Z"
          fill="url(#coinEmblemGrad)"
        />

        {/* 7. Subtle glint star at top right */}
        <Path
          d="M 28 8 Q 28 10 30 10 Q 28 10 28 12 Q 28 10 26 10 Q 28 10 28 8"
          fill="#FFFFFF"
          opacity="0.85"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default KindrCoin;
