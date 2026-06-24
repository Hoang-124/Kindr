// @ts-nocheck
// components/SplashScreen.js
// Màn hình 1: Splash Screen - Logo Kindr + Mascot gấu nhỏ

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ navigation }: { navigation: any }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    Animated.timing(slideAnim, { toValue: 0, duration: 1000, delay: 600, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Mascot Gấu */}
        <View style={styles.mascotContainer}>
          <Text style={styles.mascotEmoji}>🧸</Text>
        </View>

        {/* Logo */}
        <Text style={styles.logoText}>Kindr</Text>
        <View style={styles.logoDot} />
      </Animated.View>

      <Animated.View style={[styles.sloganContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.slogan}>Đổi đồ cũ, nhận niềm vui mới cho bé</Text>
        <View style={styles.sloganLine} />
      </Animated.View>

      {/* Small decorative elements */}
      <View style={styles.starContainer}>
        <Text style={styles.star}>✨</Text>
        <Text style={[styles.star, styles.star2]}>⭐</Text>
        <Text style={[styles.star, styles.star3]}>💫</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(163, 213, 198, 0.2)',
  },
  circle2: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 200, 178, 0.25)',
  },
  circle3: {
    position: 'absolute',
    top: '40%',
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 228, 196, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A3D5C6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(163, 213, 198, 0.3)',
  },
  mascotEmoji: {
    fontSize: 60,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#5B9A8B',
    letterSpacing: 2,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5C8B2',
    marginTop: 6,
  },
  sloganContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slogan: {
    fontSize: 16,
    color: '#8B7E74',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  sloganLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#A3D5C6',
    marginTop: 12,
  },
  starContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 20,
  },
  star: {
    fontSize: 16,
    opacity: 0.4,
  },
  star2: {
    marginTop: -10,
  },
  star3: {
    marginTop: 5,
  },
});
