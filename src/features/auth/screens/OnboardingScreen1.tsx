// @ts-nocheck
// components/OnboardingScreen1.js
// Màn hình 2: Onboarding - Dọn tủ đồ cho bé thật nhẹ nhàng

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function OnboardingScreen1({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={() => navigation.replace('SignIn')}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration area */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBg}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <Text style={styles.illustrationEmoji}>👩‍👧</Text>
          <View style={styles.itemsRow}>
            <Text style={styles.smallEmoji}>🧸</Text>
            <Text style={styles.smallEmoji}>👗</Text>
            <Text style={styles.smallEmoji}>📚</Text>
            <Text style={styles.smallEmoji}>🎮</Text>
          </View>
          <View style={styles.boxIllustration}>
            <Text style={styles.boxEmoji}>📦</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Dọn tủ đồ cho bé{'\n'}thật nhẹ nhàng</Text>
        <Text style={styles.description}>
          Những món đồ bé không dùng nữa có thể trở thành niềm vui mới cho một gia đình khác.
        </Text>
      </View>

      {/* Pagination & Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={() => navigation.navigate('Onboarding2')}
        >
          <Text style={styles.nextButtonText}>Tiếp theo</Text>
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#8B7E74',
    fontWeight: '600',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationBg: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(163, 213, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 200, 178, 0.3)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 218, 185, 0.3)',
  },
  illustrationEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  itemsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  smallEmoji: {
    fontSize: 28,
  },
  boxIllustration: {
    marginTop: 5,
  },
  boxEmoji: {
    fontSize: 40,
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3D3D3D',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#8B7E74',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4CFC7',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#5B9A8B',
  },
  nextButton: {
    backgroundColor: '#5B9A8B',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#5B9A8B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  nextArrow: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
});
