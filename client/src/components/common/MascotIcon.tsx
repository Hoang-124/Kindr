// src/components/common/MascotIcon.tsx
import React from 'react';
import { View, StyleSheet, Text, Image, ImageStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';

const MASCOT_IMAGE = require('../../../assets/images/kindr-mascot.png');

interface MascotIconProps {
  size?: number;
  mood?: 'happy' | 'protective' | 'celebrate' | 'sleeping';
  dialogue?: string;
  renderMode?: 'image' | 'vector';
}

export const MascotIcon: React.FC<MascotIconProps> = ({
  size = 64,
  mood = 'happy',
  dialogue,
  renderMode = 'image',
}) => {
  return (
    <View style={styles.container}>
      {renderMode === 'image' && mood !== 'sleeping' ? (
        <View style={[styles.imageWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image 
            source={MASCOT_IMAGE} 
            style={{ width: size, height: size, borderRadius: size / 2 }} 
            resizeMode="cover"
          />
        </View>
      ) : (
        /* Vector SVG - Authentic Kindr Buddy Mint Bear holding a Heart */
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Outer Ring */}
          <Circle cx="50" cy="50" r="47" fill="#EBF8F5" stroke="#78C2AD" strokeWidth="2.5" />

          {/* Ears */}
          <Circle cx="28" cy="28" r="14" fill="#78C2AD" />
          <Circle cx="28" cy="28" r="8" fill="#FFD166" />
          <Circle cx="72" cy="28" r="14" fill="#78C2AD" />
          <Circle cx="72" cy="28" r="8" fill="#FFD166" />

          {/* Body */}
          <Ellipse cx="50" cy="66" rx="26" ry="22" fill="#78C2AD" />
          <Ellipse cx="50" cy="68" rx="17" ry="15" fill="#FFF5EA" />

          {/* Feet with Pink Pads */}
          <Circle cx="30" cy="80" r="10" fill="#78C2AD" />
          <Circle cx="30" cy="80" r="6" fill="#FFAAA6" />
          <Circle cx="70" cy="80" r="10" fill="#78C2AD" />
          <Circle cx="70" cy="80" r="6" fill="#FFAAA6" />

          {/* Head */}
          <Circle cx="50" cy="46" r="26" fill="#78C2AD" />

          {/* Muzzle */}
          <Ellipse cx="50" cy="50" rx="12" ry="9" fill="#FFF5EA" />

          {/* Cheeks */}
          <Circle cx="34" cy="50" r="4.5" fill="#FF9AA2" opacity="0.8" />
          <Circle cx="66" cy="50" r="4.5" fill="#FF9AA2" opacity="0.8" />

          {/* Nose */}
          <Ellipse cx="50" cy="46" rx="4.5" ry="3.5" fill="#1E3A34" />

          {/* Eyes */}
          {mood === 'sleeping' ? (
            <>
              <Path d="M 38 41 Q 42 45 46 41" stroke="#1E3A34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <Path d="M 54 41 Q 58 45 62 41" stroke="#1E3A34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Happy curved eyes */}
              <Path d="M 38 42 Q 42 38 46 42" stroke="#1E3A34" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <Path d="M 54 42 Q 58 38 62 42" stroke="#1E3A34" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Mouth */}
          <Path d="M 46 51 Q 50 55 54 51" stroke="#1E3A34" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Coral Pink Heart Held in Paws */}
          <Path 
            d="M 50 62 C 48 57 41 57 41 63 C 41 68 50 74 50 74 C 50 74 59 68 59 63 C 59 57 52 57 50 62 Z" 
            fill="#FF6B8B" 
          />

          {/* Paws Hugging the Heart */}
          <Ellipse cx="41" cy="65" rx="5" ry="4" fill="#78C2AD" />
          <Ellipse cx="59" cy="65" rx="5" ry="4" fill="#78C2AD" />
        </Svg>
      )}

      {dialogue && (
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{dialogue}</Text>
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
  imageWrapper: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4EBE3',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4EBE3',
    marginTop: 6,
    maxWidth: 240,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechText: {
    fontSize: 12,
    color: '#264653',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default MascotIcon;
