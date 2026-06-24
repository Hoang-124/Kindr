// @ts-nocheck
// components/ConfirmReceiveScreen.js - Màn hình 16: Xác nhận nhận đồ
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmReceiveScreen({ navigation, route }: { navigation: any, route: any }) {
  const item = route?.params?.item || { title: 'Xe đẩy Combi', xu: 12 };
  const handleConfirm = () => {
    Alert.alert('Tuyệt quá mẹ ơi! 🎉', 'Giao dịch đã hoàn tất. Xu đã được chuyển cho người đăng.', [
      { text: 'Đánh giá ngay', onPress: () => navigation.navigate('Review', { item }) },
    ]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận nhận đồ</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.mascotEmoji}>🧸🎉</Text>
        <Text style={styles.question}>Mẹ đã nhận đúng{'\n'}món đồ chưa?</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Món đồ</Text>
          <Text style={styles.summaryValue}>{item.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.summaryLabel}>Số Xu</Text>
          <Text style={styles.summaryValue}>🪙 {item.xu} Xu</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Đúng rồi, chuyển Xu cho người đăng ✅</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('Dispute', { item })}>
          <Text style={styles.reportBtnText}>Có vấn đề cần báo ⚠️</Text>
        </TouchableOpacity>
        <View style={styles.warningCard}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningText}>Sau khi xác nhận, Xu sẽ được chuyển và giao dịch hoàn tất. Mẹ kiểm tra kỹ nhé!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 30 },
  mascotEmoji: { fontSize: 70, marginBottom: 20 },
  question: { fontSize: 26, fontWeight: '800', color: '#3D3D3D', textAlign: 'center', lineHeight: 36, marginBottom: 24 },
  summaryCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 24 },
  summaryLabel: { fontSize: 12, color: '#8B7E74', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#3D3D3D', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E8E3DB', marginVertical: 6 },
  confirmBtn: { width: '100%', backgroundColor: '#5B9A8B', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12, shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  reportBtn: { width: '100%', backgroundColor: '#FFF0F3', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD6E0', marginBottom: 20 },
  reportBtnText: { fontSize: 14, fontWeight: '700', color: '#D4577A' },
  warningCard: { flexDirection: 'row', backgroundColor: '#FFF8EB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFE0A3' },
  warningEmoji: { fontSize: 20, marginRight: 10 },
  warningText: { flex: 1, fontSize: 12, color: '#8B6914', lineHeight: 18 },
});
