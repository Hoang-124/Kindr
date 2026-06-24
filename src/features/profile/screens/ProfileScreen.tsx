// @ts-nocheck
// components/ProfileScreen.js - Màn hình 21: Hồ sơ cá nhân
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';
import { useSelector } from 'react-redux';

const menuItems = [
  { icon: 'person-outline', label: 'Thông tin cá nhân', screen: 'EditProfile', emoji: '👤' },
  { icon: 'document-text-outline', label: 'Bài đăng của tôi', screen: 'MyPosts', emoji: '📋' },
  { icon: 'swap-horizontal-outline', label: 'Giao dịch của tôi', screen: 'TransactionDetail', emoji: '🔄' },
  { icon: 'wallet-outline', label: 'Ví Xu', screen: 'Wallet', emoji: '💰' },
  { icon: 'star-outline', label: 'Đánh giá của tôi', screen: 'Review', emoji: '⭐' },
  { icon: 'help-circle-outline', label: 'Trung tâm hỗ trợ', screen: 'HelpCenter', emoji: '❓' },
  { icon: 'shield-checkmark-outline', label: 'Chính sách app', screen: 'PolicyScreen', emoji: '🛡️' },
];

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { state, dispatch } = useContext(AppContext);
  const wallet = useSelector(s => s.wallet);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Cá nhân</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#3D3D3D" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{state.user?.avatar || 'K'}</Text>
          </View>
          <Text style={styles.userName}>{state.user?.name || 'Mẹ Kindr'}</Text>
          <Text style={styles.userLocation}>📍 {state.user?.location || 'Quận 7, TP.HCM'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {state.user?.rating || 4.8}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.user?.transactions || 12}</Text>
              <Text style={styles.statLabel}>Giao dịch</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🪙 {wallet.balance}</Text>
              <Text style={styles.statLabel}>Xu</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C4BFB6" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {
          dispatch({ type: 'LOGOUT' });
          navigation.navigate('SignIn');
        }}>
          <Ionicons name="log-out-outline" size={20} color="#D4577A" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  profileCard: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 18 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#A3D5C6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#E0F2EE' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#3D3D3D', marginBottom: 4 },
  userLocation: { fontSize: 13, color: '#8B7E74', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#3D3D3D', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#8B7E74' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E8E3DB' },
  menuContainer: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', marginBottom: 18 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3D3D3D' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, backgroundColor: '#FFF0F3', borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#FFD6E0' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#D4577A' },
});
