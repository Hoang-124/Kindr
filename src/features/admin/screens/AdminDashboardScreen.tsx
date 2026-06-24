// @ts-nocheck
// components/AdminDashboardScreen.js - Màn hình 27: Admin Dashboard
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const stats = [
  { label: 'Tổng người dùng', value: '1,248', icon: '👥', color: '#5B9A8B' },
  { label: 'Tổng bài đăng', value: '3,567', icon: '📋', color: '#F5A623' },
  { label: 'Giao dịch hoàn tất', value: '892', icon: '✅', color: '#5B9A8B' },
  { label: 'Khiếu nại đang chờ', value: '5', icon: '⚠️', color: '#D4577A' },
  { label: 'Yêu cầu rút Xu', value: '12', icon: '💰', color: '#F5A623' },
];

const adminMenus = [
  { label: 'Quản lý người dùng', icon: '👥', screen: 'AdminDashboard' },
  { label: 'Quản lý bài đăng', icon: '📋', screen: 'AdminPosts' },
  { label: 'Quản lý giao dịch', icon: '🔄', screen: 'AdminDashboard' },
  { label: 'Quản lý khiếu nại', icon: '⚠️', screen: 'AdminDisputes' },
  { label: 'Quản lý danh mục', icon: '🏷️', screen: 'AdminDashboard' },
  { label: 'Quản lý yêu cầu rút Xu', icon: '💰', screen: 'AdminWithdrawals' },
];

export default function AdminDashboardScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, i === stats.length - 1 && stats.length % 2 !== 0 && { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Text style={styles.statEmoji}>{stat.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Admin Menu */}
        <Text style={styles.sectionTitle}>Quản lý</Text>
        <View style={styles.menuContainer}>
          {adminMenus.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
              <View style={styles.menuIcon}><Text style={styles.menuEmoji}>{item.icon}</Text></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C4BFB6" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  adminBadge: { backgroundColor: '#5B9A8B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: '#ffffff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8B7E74', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D', paddingHorizontal: 20, marginBottom: 12 },
  menuContainer: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3D3D3D' },
});
