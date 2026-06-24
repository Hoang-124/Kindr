// @ts-nocheck
// components/PolicyScreen.js - Màn hình 26: Chính sách app trung gian
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const policies = [
  { icon: '🤝', title: 'Kindr là nền tảng trung gian', desc: 'Kindr kết nối người có đồ cũ với người cần nhận đồ. Kindr không phải cửa hàng, không sở hữu bất kỳ sản phẩm nào trên nền tảng.' },
  { icon: '📦', title: 'Kindr không kiểm định sản phẩm', desc: 'Người đăng tự mô tả tình trạng sản phẩm. Người nhận cần kiểm tra kỹ món đồ trước khi xác nhận nhận hàng.' },
  { icon: '🚚', title: 'Kindr không vận chuyển', desc: 'Hai bên tự sắp xếp giao nhận. Kindr khuyến khích gặp mặt trực tiếp để kiểm tra món đồ.' },
  { icon: '🛡️', title: 'Kindr không bảo hành sản phẩm', desc: 'Sản phẩm trao đổi là đồ đã qua sử dụng. Kindr không cam kết chất lượng hay bảo hành cho bất kỳ sản phẩm nào.' },
  { icon: '🧸', title: 'Kindr giữ Xu tạm thời', desc: 'Hệ thống giữ Xu tạm thời khi có giao dịch. Xu chỉ được chuyển sau khi người nhận xác nhận. Điều này giảm thiểu rủi ro cho cả hai bên.' },
  { icon: '✅', title: 'Trách nhiệm người dùng', desc: 'Người dùng cần mô tả trung thực tình trạng sản phẩm, kiểm tra kỹ trước khi xác nhận, và tôn trọng lẫn nhau trong giao tiếp.' },
];

export default function PolicyScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách của Kindr</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🛡️</Text>
          <Text style={styles.introTitle}>Kindr cam kết minh bạch</Text>
          <Text style={styles.introDesc}>Chúng tôi muốn mẹ hiểu rõ vai trò của Kindr để trải nghiệm tốt hơn</Text>
        </View>
        {policies.map((p, i) => (
          <View key={i} style={styles.policyCard}>
            <View style={styles.policyIcon}><Text style={styles.policyIconText}>{p.icon}</Text></View>
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>{p.title}</Text>
              <Text style={styles.policyDesc}>{p.desc}</Text>
            </View>
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
  introCard: { marginHorizontal: 20, backgroundColor: '#5B9A8B', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 18 },
  introEmoji: { fontSize: 40, marginBottom: 10 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  introDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  policyCard: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 10, alignItems: 'flex-start' },
  policyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  policyIconText: { fontSize: 22 },
  policyContent: { flex: 1 },
  policyTitle: { fontSize: 15, fontWeight: '700', color: '#3D3D3D', marginBottom: 6 },
  policyDesc: { fontSize: 13, color: '#5D5347', lineHeight: 20 },
});
