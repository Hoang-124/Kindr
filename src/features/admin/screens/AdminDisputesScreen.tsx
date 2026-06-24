// @ts-nocheck
// components/AdminDisputesScreen.js - Màn hình 29: Admin xử lý khiếu nại
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockDisputes = [
  { id: '1', item: 'Nôi điện Mastela', buyer: 'Mẹ Tú', seller: 'Mẹ Gấu', reason: 'Hư hỏng nặng', xu: 8, status: 'pending',
    evidence: 'Nút điều khiển bị hỏng hoàn toàn, không như mô tả "chỉ lỗi nhỏ"',
    sellerResponse: 'Khi mình bán thì nút vẫn hoạt động, có thể do vận chuyển' },
  { id: '2', item: 'Bộ quần áo bé gái', buyer: 'Mẹ Lan', seller: 'Mẹ Sóc', reason: 'Thiếu bộ phận', xu: 4, status: 'pending',
    evidence: 'Chỉ nhận được 7 bộ thay vì 10 bộ như mô tả',
    sellerResponse: 'Mình đã đếm kỹ trước khi giao, đúng 10 bộ' },
];

export default function AdminDisputesScreen({ navigation }: { navigation: any }) {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const handleDecision = (decision) => {
    const labels = {
      refund: 'Hoàn Xu cho người nhận',
      transfer: 'Chuyển Xu cho người đăng',
      cancel: 'Hủy giao dịch',
      ban: 'Khóa tài khoản vi phạm',
    };
    Alert.alert('Xác nhận quyết định', labels[decision], [
      { text: 'Hủy' },
      { text: 'Xác nhận', onPress: () => {
        Alert.alert('Đã xử lý! ✅', 'Quyết định đã được áp dụng.');
        setSelectedDispute(null);
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý khiếu nại</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{mockDisputes.length}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!selectedDispute ? (
          mockDisputes.map(d => (
            <TouchableOpacity key={d.id} style={styles.disputeCard} onPress={() => setSelectedDispute(d)}>
              <View style={styles.disputeHeader}>
                <View style={styles.disputeIcon}><Text style={styles.disputeEmoji}>⚠️</Text></View>
                <View style={styles.disputeInfo}>
                  <Text style={styles.disputeItem}>{d.item}</Text>
                  <Text style={styles.disputeReason}>{d.reason}</Text>
                </View>
                <View style={styles.disputeXu}><Text style={styles.disputeXuText}>🪙 {d.xu}</Text></View>
              </View>
              <View style={styles.disputePeople}>
                <Text style={styles.disputePerson}>Người nhận: {d.buyer}</Text>
                <Text style={styles.disputePerson}>Người đăng: {d.seller}</Text>
              </View>
              <View style={styles.pendingBadge}><Text style={styles.pendingText}>⏳ Đang chờ xử lý</Text></View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.detailContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>📦 {selectedDispute.item}</Text>
              <Text style={styles.detailLabel}>Lý do khiếu nại</Text>
              <Text style={styles.detailValue}>{selectedDispute.reason}</Text>
              <Text style={styles.detailLabel}>Bằng chứng từ người nhận</Text>
              <View style={styles.evidenceBox}><Text style={styles.evidenceText}>{selectedDispute.evidence}</Text></View>
              <Text style={styles.detailLabel}>Phản hồi từ người đăng</Text>
              <View style={styles.evidenceBox}><Text style={styles.evidenceText}>{selectedDispute.sellerResponse}</Text></View>
              <Text style={styles.detailLabel}>Ghi chú admin</Text>
              <TextInput style={styles.noteInput} value={adminNote} onChangeText={setAdminNote} placeholder="Ghi chú xử lý..." placeholderTextColor="#C4BFB6" multiline />
            </View>

            <Text style={styles.decisionTitle}>Quyết định xử lý</Text>
            <View style={styles.decisionGrid}>
              <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: '#E8F5E8' }]} onPress={() => handleDecision('refund')}>
                <Text style={styles.decisionEmoji}>↩️</Text>
                <Text style={styles.decisionLabel}>Hoàn Xu cho{'\n'}người nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: '#FFF8EB' }]} onPress={() => handleDecision('transfer')}>
                <Text style={styles.decisionEmoji}>✅</Text>
                <Text style={styles.decisionLabel}>Chuyển Xu cho{'\n'}người đăng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: '#F5F0E8' }]} onPress={() => handleDecision('cancel')}>
                <Text style={styles.decisionEmoji}>❌</Text>
                <Text style={styles.decisionLabel}>Hủy giao dịch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: '#FFF0F3' }]} onPress={() => handleDecision('ban')}>
                <Text style={styles.decisionEmoji}>🚫</Text>
                <Text style={styles.decisionLabel}>Khóa tài khoản{'\n'}vi phạm</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedDispute(null)}>
              <Text style={styles.backBtnText}>← Quay lại danh sách</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  badge: { backgroundColor: '#D4577A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  disputeCard: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 12 },
  disputeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  disputeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF8EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  disputeEmoji: { fontSize: 20 },
  disputeInfo: { flex: 1 },
  disputeItem: { fontSize: 15, fontWeight: '700', color: '#3D3D3D' },
  disputeReason: { fontSize: 12, color: '#D4577A', fontWeight: '600', marginTop: 2 },
  disputeXu: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FFF8EB', borderRadius: 10 },
  disputeXuText: { fontSize: 13, fontWeight: '700', color: '#8B6914' },
  disputePeople: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  disputePerson: { fontSize: 11, color: '#8B7E74' },
  pendingBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF8EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { fontSize: 11, fontWeight: '600', color: '#8B6914' },
  detailContainer: { paddingHorizontal: 20 },
  detailCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 18 },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D', marginBottom: 14 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#8B7E74', marginBottom: 6, marginTop: 10 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#D4577A' },
  evidenceBox: { backgroundColor: '#F5F0E8', borderRadius: 12, padding: 12 },
  evidenceText: { fontSize: 13, color: '#5D5347', lineHeight: 20 },
  noteInput: { borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 12, padding: 12, fontSize: 13, color: '#3D3D3D', height: 80, textAlignVertical: 'top', backgroundColor: '#FDFCFA' },
  decisionTitle: { fontSize: 16, fontWeight: '800', color: '#3D3D3D', marginBottom: 12 },
  decisionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  decisionBtn: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center' },
  decisionEmoji: { fontSize: 24, marginBottom: 6 },
  decisionLabel: { fontSize: 12, fontWeight: '700', color: '#3D3D3D', textAlign: 'center' },
  backBtn: { alignItems: 'center', paddingVertical: 14 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#5B9A8B' },
});
