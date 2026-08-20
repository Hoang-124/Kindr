// src/components/common/MascotIcon.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { COLORS } from '../../theme/colors';

interface MascotIconProps {
  size?: number;
  mood?: 'happy' | 'protective' | 'celebrate' | 'sleeping';
  dialogue?: string;
}

export const MascotIcon: React.FC<MascotIconProps> = ({ 
  size = 60, 
  mood = 'happy',
  dialogue 
}) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Outer Circle Background */}
        <Circle cx="50" cy="50" r="46" fill="#FFF0EB" stroke="#F26A36" strokeWidth="2" />
        
        {/* Ears */}
        <Circle cx="26" cy="28" r="14" fill="#6B5B5E" />
        <Circle cx="26" cy="28" r="8" fill="#FF8C61" opacity="0.6" />
        <Circle cx="74" cy="28" r="14" fill="#6B5B5E" />
        <Circle cx="74" cy="28" r="8" fill="#FF8C61" opacity="0.6" />

        {/* Head/Face */}
        <Circle cx="50" cy="52" r="32" fill="#E8D5C4" />

        {/* Eyes */}
        {mood === 'sleeping' ? (
          <>
            <Path d="M 40 48 Q 44 52 48 48" stroke="#2D2325" strokeWidth="3" fill="none" />
            <Path d="M 52 48 Q 56 52 60 48" stroke="#2D2325" strokeWidth="3" fill="none" />
          </>
        ) : (
          <>
            <Circle cx="42" cy="46" r="4.5" fill="#2D2325" />
            <Circle cx="58" cy="46" r="4.5" fill="#2D2325" />
            <Circle cx="43.5" cy="44.5" r="1.5" fill="#FFFFFF" />
            <Circle cx="59.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Cheeks */}
        <Circle cx="35" cy="55" r="4" fill="#FF8C61" opacity="0.7" />
        <Circle cx="65" cy="55" r="4" fill="#FF8C61" opacity="0.7" />

        {/* Nose */}
        <Ellipse cx="50" cy="54" rx="7" ry="5" fill="#3D2C2E" />

        {/* Mouth */}
        {mood === 'celebrate' || mood === 'happy' ? (
          <Path d="M 44 63 Q 50 70 56 63" stroke="#3D2C2E" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === 'protective' ? (
          <Path d="M 45 64 Q 50 67 55 64" stroke="#3D2C2E" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <Path d="M 45 64 Q 50 62 55 64" stroke="#3D2C2E" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </Svg>

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
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    marginTop: 6,
    maxWidth: 220,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechText: {
    fontSize: 12,
    color: '#2D2325',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MascotIcon;
