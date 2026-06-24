// @ts-nocheck
// components/DisputeScreen.js - Màn hình 17: Khiếu nại
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const reasons = ['Không đúng mô tả', 'Hư hỏng nặng', 'Thiếu bộ phận', 'Không nhận được đồ', 'Lý do khác'];

export default function DisputeScreen({ navigation, route }: { navigation: any, route: any }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Báo vấn đề với món đồ</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Chọn lý do *</Text>
          <View style={styles.reasonsContainer}>
            {reasons.map(r => (
              <TouchableOpacity key={r} style={[styles.reasonChip, selectedReason === r && styles.reasonChipActive]} onPress={() => setSelectedReason(r)}>
                <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Mô tả vấn đề</Text>
          <TextInput style={styles.textArea} placeholder="Mẹ mô tả chi tiết vấn đề gặp phải..." placeholderTextColor="#C4BFB6" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
          <Text style={styles.label}>Ảnh/Video bằng chứng</Text>
          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={28} color="#A3D5C6" />
            <Text style={styles.uploadText}>Tải ảnh/video lên</Text>
          </TouchableOpacity>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🧸</Text>
            <Text style={styles.tipText}>Gấu sẽ giữ Xu lại trong lúc admin xem xét giúp mẹ. Mọi thứ sẽ được giải quyết công bằng nhé!</Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={() => {
            if (!selectedReason) { Alert.alert('🧸', 'Mẹ cần chọn lý do khiếu nại nhé.'); return; }
            Alert.alert('Đã gửi khiếu nại! 📨', 'Admin sẽ xem xét và phản hồi sớm nhất cho mẹ.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }}>
            <Text style={styles.submitBtnText}>Gửi khiếu nại 📨</Text>
          </TouchableOpacity>
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
  card: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 10, marginTop: 6 },
  reasonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  reasonChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F5F0E8', borderWidth: 1.5, borderColor: '#E8E3DB' },
  reasonChipActive: { backgroundColor: '#D4577A', borderColor: '#D4577A' },
  reasonText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  reasonTextActive: { color: '#ffffff' },
  textArea: { borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 14, padding: 14, fontSize: 14, color: '#3D3D3D', height: 100, textAlignVertical: 'top', backgroundColor: '#FDFCFA', marginBottom: 16 },
  uploadBox: { height: 100, borderRadius: 16, borderWidth: 2, borderColor: '#E8E3DB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  uploadText: { fontSize: 13, color: '#5B9A8B', fontWeight: '600', marginTop: 6 },
  tipCard: { flexDirection: 'row', backgroundColor: '#FFF8EB', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FFE0A3', alignItems: 'center' },
  tipEmoji: { fontSize: 28, marginRight: 10 },
  tipText: { flex: 1, fontSize: 12, color: '#8B6914', lineHeight: 18 },
  submitBtn: { backgroundColor: '#D4577A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
