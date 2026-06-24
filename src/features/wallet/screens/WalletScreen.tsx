// @ts-nocheck
// components/WalletScreen.js
// Màn hình 12: Ví Xu của mẹ

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

const typeColors = { deposit: '#5B9A8B', earn: '#5B9A8B', spend: '#D4577A', escrow: '#F5A623', withdraw: '#D4577A', refund: '#5B9A8B' };
const typeLabels = { deposit: 'Nạp Xu', earn: 'Nhận Xu', spend: 'Dùng Xu', escrow: 'Xu đang giữ', withdraw: 'Rút Xu', refund: 'Hoàn Xu' };
const typeIcons = { deposit: '💰', earn: '🎉', spend: '🛒', escrow: '🧸', withdraw: '🏦', refund: '↩️' };

export default function WalletScreen({ navigation }: { navigation: any }) {
  const wallet = useSelector(s => s.wallet);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ví Xu của mẹ</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletDecor1} />
          <View style={styles.walletDecor2} />
          <Text style={styles.walletLabel}>Xu khả dụng</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceEmoji}>🪙</Text>
            <Text style={styles.balanceAmount}>{wallet.balance}</Text>
            <Text style={styles.balanceUnit}>Xu</Text>
          </View>
          <Text style={styles.walletMotivation}>
            Trong ví của mẹ đang có {wallet.balance} Xu lấp lánh, đổi quà cho bé thôi nào! ✨
          </Text>

          {/* Escrow info */}
          <View style={styles.escrowRow}>
            <Text style={styles.escrowEmoji}>🧸</Text>
            <Text style={styles.escrowText}>Gấu đang giữ hộ: {wallet.escrow} Xu</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DepositXu')}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Text style={styles.actionEmoji}>💰</Text>
            </View>
            <Text style={styles.actionLabel}>Nạp Xu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('WithdrawXu')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF0F3' }]}>
              <Text style={styles.actionEmoji}>🏦</Text>
            </View>
            <Text style={styles.actionLabel}>Rút Xu</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          {wallet.history.map(tx => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txIcon}>
                <Text style={styles.txIconText}>{typeIcons[tx.type]}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <View style={styles.txMetaRow}>
                  <Text style={styles.txDate}>{tx.date}</Text>
                  <View style={[styles.txStatusBadge, tx.status === 'holding' && styles.txStatusHolding]}>
                    <Text style={[styles.txStatusText, tx.status === 'holding' && styles.txStatusTextHolding]}>
                      {tx.status === 'completed' ? '✅ Hoàn tất' : tx.status === 'holding' ? '🧸 Đang giữ' : '⏳ Chờ duyệt'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: tx.amount >= 0 ? '#5B9A8B' : '#D4577A' }]}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount} Xu
              </Text>
            </View>
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
  walletCard: {
    marginHorizontal: 20, borderRadius: 28, backgroundColor: '#5B9A8B', padding: 28,
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
    overflow: 'hidden', position: 'relative',
  },
  walletDecor1: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  walletDecor2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  walletLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  balanceEmoji: { fontSize: 32 },
  balanceAmount: { fontSize: 48, fontWeight: '900', color: '#ffffff' },
  balanceUnit: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  walletMotivation: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginBottom: 16 },
  escrowRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  escrowEmoji: { fontSize: 20 },
  escrowText: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 18 },
  actionCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#3D3D3D' },
  historySection: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D', marginBottom: 14 },
  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  txIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txIconText: { fontSize: 20 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: '600', color: '#3D3D3D', marginBottom: 4 },
  txMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txDate: { fontSize: 11, color: '#8B7E74' },
  txStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#E8F5E8' },
  txStatusHolding: { backgroundColor: '#FFF8EB' },
  txStatusText: { fontSize: 10, fontWeight: '600', color: '#5B9A8B' },
  txStatusTextHolding: { color: '#8B6914' },
  txAmount: { fontSize: 15, fontWeight: '800' },
});
