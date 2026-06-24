// @ts-nocheck
// components/OnboardingScreen3.js
// Màn hình 4: Gấu giữ Xu giúp mẹ - Giới thiệu giao dịch an toàn

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function OnboardingScreen3({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={() => navigation.replace('SignIn')}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBg}>
          <View style={styles.shieldContainer}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
          <View style={styles.mascotHolding}>
            <Text style={styles.mascotEmoji}>🧸</Text>
            <View style={styles.xuBubble}>
              <Text style={styles.xuBubbleText}>Xu an toàn!</Text>
            </View>
          </View>
          <View style={styles.checkMarks}>
            <Text style={styles.checkEmoji}>✅</Text>
            <Text style={styles.checkEmoji}>✅</Text>
            <Text style={styles.checkEmoji}>✅</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Gấu giữ Xu giúp mẹ</Text>
        <Text style={styles.description}>
          Xu chỉ được chuyển khi mẹ xác nhận đã nhận đúng món đồ. An tâm trao đổi nhé mẹ ơi!
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.replace('SignIn')}
        >
          <Text style={styles.startButtonText}>Bắt đầu ngay 🎉</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F5',
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
  },
  illustrationBg: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(163, 213, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContainer: {
    marginBottom: 5,
  },
  shieldEmoji: {
    fontSize: 50,
  },
  mascotHolding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mascotEmoji: {
    fontSize: 60,
  },
  xuBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  xuBubbleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B9A8B',
  },
  checkMarks: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  checkEmoji: {
    fontSize: 24,
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
  startButton: {
    backgroundColor: '#5B9A8B',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B9A8B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
});
