// @ts-nocheck
// components/OnboardingScreen2.js
// Màn hình 3: Giới thiệu hệ thống Xu

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function OnboardingScreen2({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={() => navigation.replace('SignIn')}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBg}>
          <View style={styles.coinRow}>
            <View style={styles.coinLarge}>
              <Text style={styles.coinText}>Xu</Text>
            </View>
            <View style={[styles.coinSmall, { top: -20, right: -10 }]}>
              <Text style={styles.coinSmallText}>✦</Text>
            </View>
            <View style={[styles.coinSmall, { bottom: 0, left: -15 }]}>
              <Text style={styles.coinSmallText}>✦</Text>
            </View>
          </View>
          <View style={styles.mascotWithBag}>
            <Text style={styles.mascotEmoji}>🧸</Text>
            <View style={styles.bagContainer}>
              <Text style={styles.bagEmoji}>💰</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Đổi đồ bằng Xu,{'\n'}không cần mặc cả</Text>
        <Text style={styles.description}>
          Mẹ đăng đồ cũ để nhận Xu, rồi dùng Xu đổi món đồ khác cho bé. Đơn giản lắm mẹ ơi!
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={() => navigation.navigate('Onboarding3')}
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
    backgroundColor: '#FFF8F0',
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
    backgroundColor: 'rgba(255, 213, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinRow: {
    position: 'relative',
    marginBottom: 15,
  },
  coinLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD580',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5A623',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  coinText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#8B6914',
  },
  coinSmall: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFEBB7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  coinSmallText: {
    fontSize: 12,
    color: '#8B6914',
  },
  mascotWithBag: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  mascotEmoji: {
    fontSize: 60,
  },
  bagContainer: {
    marginBottom: 5,
  },
  bagEmoji: {
    fontSize: 35,
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
    backgroundColor: '#F5A623',
  },
  nextButton: {
    backgroundColor: '#F5A623',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#F5A623',
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
