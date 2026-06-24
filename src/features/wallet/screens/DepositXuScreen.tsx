// @ts-nocheck
// components/DepositXuScreen.js - Màn hình 13: Nạp Xu
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { depositXu } from '../../../app/store/walletSlice';

const quickAmounts = [5, 10, 20, 50];

export default function DepositXuScreen({ navigation }: { navigation: any }) {
  const [amount, setAmount] = useState('10');
  const [transferred, setTransferred] = useState(false);
  const dispatch = useDispatch();

  const xuAmount = parseInt(amount) || 0;
  const vndAmount = xuAmount * 10000;

  const handleConfirm = () => {
    if (xuAmount <= 0) { Alert.alert('Ôi không! 🧸', 'Mẹ cần nhập số Xu muốn nạp nhé.'); return; }
    dispatch(depositXu({ amount: xuAmount }));
    Alert.alert('Tuyệt quá mẹ ơi! 🎉', `Đã nạp thành công ${xuAmount} Xu vào ví. Đổi quà cho bé thôi nào!`, [
      { text: 'Về ví Xu', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Nạp Xu</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Số Xu muốn nạp</Text>
          <View style={styles.amountInput}>
            <Text style={styles.xuEmoji}>🪙</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
            <Text style={styles.xuUnit}>Xu</Text>
          </View>

          <View style={styles.quickRow}>
            {quickAmounts.map(a => (
              <TouchableOpacity key={a} style={[styles.quickBtn, parseInt(amount) === a && styles.quickBtnActive]} onPress={() => setAmount(a.toString())}>
                <Text style={[styles.quickText, parseInt(amount) === a && styles.quickTextActive]}>{a} Xu</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.convertBox}>
            <Text style={styles.convertLabel}>Quy đổi</Text>
            <Text style={styles.convertRate}>1 Xu = 10.000 VNĐ</Text>
            <View style={styles.convertResult}>
              <Text style={styles.convertAmount}>{xuAmount} Xu = {vndAmount.toLocaleString()} VNĐ</Text>
            </View>
          </View>

          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>QR Thanh toán</Text>
            <View style={styles.qrBox}>
              <Text style={styles.qrEmoji}>📱</Text>
              <Text style={styles.qrText}>QR Code Demo</Text>
              <Text style={styles.qrSubtext}>Mở app ngân hàng quét mã</Text>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteEmoji}>📝</Text>
            <Text style={styles.noteText}>Giai đoạn thử nghiệm, giao dịch có thể được admin duyệt thủ công.</Text>
          </View>

          {!transferred ? (
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setTransferred(true)}>
              <Text style={styles.confirmBtnText}>Tôi đã chuyển khoản ✅</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.pendingBadge}><Text style={styles.pendingText}>⏳ Đang chờ xác nhận...</Text></View>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Xác nhận nạp Xu (Demo) 🎉</Text>
              </TouchableOpacity>
            </View>
          )}
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
  card: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 15, fontWeight: '700', color: '#3D3D3D', marginBottom: 12 },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#A3D5C6', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14 },
  xuEmoji: { fontSize: 24, marginRight: 10 },
  input: { flex: 1, fontSize: 28, fontWeight: '800', color: '#3D3D3D' },
  xuUnit: { fontSize: 18, fontWeight: '700', color: '#8B6914' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5F0E8', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E3DB' },
  quickBtnActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  quickText: { fontSize: 13, fontWeight: '700', color: '#5D5347' },
  quickTextActive: { color: '#ffffff' },
  convertBox: { backgroundColor: '#F5F0E8', borderRadius: 16, padding: 16, marginBottom: 18 },
  convertLabel: { fontSize: 12, color: '#8B7E74', fontWeight: '600' },
  convertRate: { fontSize: 13, color: '#5B9A8B', fontWeight: '700', marginTop: 4 },
  convertResult: { marginTop: 8 },
  convertAmount: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  qrSection: { marginBottom: 18 },
  qrTitle: { fontSize: 15, fontWeight: '700', color: '#3D3D3D', marginBottom: 10 },
  qrBox: { alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: 18, padding: 30, borderWidth: 1.5, borderColor: '#E8E3DB' },
  qrEmoji: { fontSize: 50, marginBottom: 8 },
  qrText: { fontSize: 16, fontWeight: '700', color: '#3D3D3D' },
  qrSubtext: { fontSize: 12, color: '#8B7E74', marginTop: 4 },
  noteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8EB', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FFE0A3' },
  noteEmoji: { fontSize: 20, marginRight: 10 },
  noteText: { flex: 1, fontSize: 12, color: '#8B6914', lineHeight: 18 },
  confirmBtn: { backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  pendingBadge: { backgroundColor: '#FFF8EB', borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 12 },
  pendingText: { fontSize: 14, fontWeight: '600', color: '#8B6914' },
});
