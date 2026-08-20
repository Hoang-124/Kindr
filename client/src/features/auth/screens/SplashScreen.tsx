// src/features/auth/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../../theme';
import { DEFAULT_IMAGES } from '../../../utils/constants';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Loading bar progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false, // width animation doesn't support native driver
    }).start(() => {
      // Transition to onboarding
      navigation.replace('Onboarding');
    });
  }, [fadeAnim, progressAnim, navigation]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>Kindr</Text>

        <View style={styles.mascotContainer}>
          <Image 
            source={{ uri: DEFAULT_IMAGES.MASCOT }} 
            style={styles.mascot}
            resizeMode="contain"
          />
          <View style={styles.mascotShadow} />
        </View>

        <Text style={styles.tagline}>
          Đổi đồ cũ, nhận niềm vui mới cho bé
        </Text>

        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: widthInterpolation }]} />
        </View>
      </Animated.View>

      <View style={styles.blob1} />
      <View style={styles.blob2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.containerPadding,
    zIndex: 10,
  },
  logoText: {
    ...TYPOGRAPHY.displayLg,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    fontWeight: '800',
  },
  mascotContainer: {
    width: 200,
    height: 200,
    marginBottom: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: '90%',
    height: '90%',
    borderRadius: RADIUS.full,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.sm,
  },
  mascotShadow: {
    position: 'absolute',
    bottom: -10,
    width: 140,
    height: 15,
    backgroundColor: 'rgba(58, 103, 88, 0.1)',
    borderRadius: RADIUS.full,
    zIndex: -1,
  },
  tagline: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 240,
    marginBottom: SPACING.xxl,
  },
  progressBarContainer: {
    width: 80,
    height: 6,
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  blob1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.full,
    opacity: 0.25,
    zIndex: 0,
  },
  blob2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 300,
    height: 300,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.full,
    opacity: 0.35,
    zIndex: 0,
  },
});
export default SplashScreen;
