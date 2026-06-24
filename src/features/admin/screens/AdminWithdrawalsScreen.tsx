// @ts-nocheck
// components/AdminWithdrawalsScreen.js - Màn hình 30: Admin quản lý yêu cầu rút Xu
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockWithdrawals = [
  { id: '1', user: 'Mẹ Bống', xu: 20, fee: 2, net: 18, vnd: 180000, bank: 'Vietcombank', account: '1234567890', status: 'pending' },
  { id: '2', user: 'Mẹ Min', xu: 10, fee: 1, net: 9, vnd: 90000, bank: 'Techcombank', account: '0987654321', status: 'pending' },
  { id: '3', user: 'Mẹ Na', xu: 30, fee: 3, net: 27, vnd: 270000, bank: 'BIDV', account: '1122334455', status: 'done' },
  { id: '4', user: 'Mẹ Sóc', xu: 5, fee: 1, net: 4, vnd: 40000, bank: 'Vietinbank', account: '5544332211', status: 'rejected' },
];

const statusLabels = { pending: '⏳ Chờ duyệt', done: '✅ Đã xử lý', rejected: '❌ Từ chối' };
const statusColors = { pending: '#FFF8EB', done: '#E8F5E8', rejected: '#FFF0F3' };

export default function AdminWithdrawalsScreen({ navigation }: { navigation: any }) {
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals);

  const handleAction = (id, action) => {
    const label = action === 'approve' ? 'Duyệt yêu cầu rút Xu?' : 'Từ chối yêu cầu rút Xu?';
    Alert.alert('Xác nhận', label, [
      { text: 'Hủy' },
      { text: 'OK', onPress: () => setWithdrawals(prev => prev.map(w =>
        w.id === id ? { ...w, status: action === 'approve' ? 'done' : 'rejected' } : w
      )) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu rút Xu</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{withdrawals.filter(w => w.status === 'pending').length}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {withdrawals.map(w => (
          <View key={w.id} style={styles.withdrawCard}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{w.user.charAt(0)}</Text></View>
                <Text style={styles.userName}>{w.user}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[w.status] }]}>
                <Text style={styles.statusText}>{statusLabels[w.status]}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Số Xu rút</Text><Text style={styles.detailValue}>🪙 {w.xu} Xu</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Phí 10%</Text><Text style={styles.detailValueRed}>-{w.fee} Xu</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Thực nhận</Text><Text style={styles.detailValueGreen}>{w.net} Xu</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Tiền VNĐ</Text><Text style={styles.detailValueBold}>{w.vnd.toLocaleString()}đ</Text></View>
            </View>

            <View style={styles.bankInfo}>
              <Text style={styles.bankLabel}>🏦 {w.bank}</Text>
              <Text style={styles.bankAccount}>STK: {w.account}</Text>
            </View>

            {w.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(w.id, 'approve')}>
                  <Text style={styles.approveBtnText}>Duyệt ✅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(w.id, 'reject')}>
                  <Text style={styles.rejectBtnText}>Từ chối ❌</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  badge: { backgroundColor: '#F5A623', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  withdrawCard: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#A3D5C6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 15, fontWeight: '700', color: '#3D3D3D' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#3D3D3D' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detailItem: { width: '47%', backgroundColor: '#F5F0E8', borderRadius: 10, padding: 10 },
  detailLabel: { fontSize: 10, color: '#8B7E74', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#3D3D3D' },
  detailValueRed: { fontSize: 14, fontWeight: '700', color: '#D4577A' },
  detailValueGreen: { fontSize: 14, fontWeight: '700', color: '#5B9A8B' },
  detailValueBold: { fontSize: 14, fontWeight: '800', color: '#3D3D3D' },
  bankInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F5F0E8', marginBottom: 10 },
  bankLabel: { fontSize: 13, fontWeight: '600', color: '#3D3D3D' },
  bankAccount: { fontSize: 13, color: '#8B7E74' },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#5B9A8B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  rejectBtn: { flex: 1, backgroundColor: '#FFF0F3', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD6E0' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#D4577A' },
});
