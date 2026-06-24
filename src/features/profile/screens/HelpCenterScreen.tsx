// @ts-nocheck
// components/HelpCenterScreen.js - Màn hình 25: Trung tâm hỗ trợ
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const faqs = [
  { q: 'Kindr hoạt động như thế nào?', a: 'Kindr là nền tảng trung gian giúp các bậc phụ huynh trao đổi đồ cũ của trẻ em thông qua hệ thống Xu nội bộ. Mẹ đăng đồ cũ để nhận Xu, rồi dùng Xu để đổi món đồ khác cho bé.', icon: '🏠' },
  { q: 'Xu là gì?', a: 'Xu là đơn vị trao đổi nội bộ trong Kindr. 1 Xu = 10.000 VNĐ. Mẹ có thể nạp Xu bằng chuyển khoản hoặc nhận Xu từ việc bán đồ cũ.', icon: '🪙' },
  { q: 'Khi nào Xu được chuyển?', a: 'Xu chỉ được chuyển cho người đăng đồ khi người nhận đã xác nhận nhận đúng món đồ. Trong thời gian chờ, Gấu Kindr giữ Xu an toàn giúp mẹ.', icon: '🧸' },
  { q: 'Nếu hàng không đúng mô tả thì sao?', a: 'Mẹ có thể mở khiếu nại. Admin sẽ xem xét và quyết định hoàn Xu nếu món đồ không đúng mô tả. Xu được giữ an toàn trong suốt quá trình xử lý.', icon: '⚠️' },
  { q: 'Kindr có giao hàng không?', a: 'Kindr không tự giao hàng. Hai bên tự hẹn giao nhận trực tiếp. Mẹ nên gặp mặt để kiểm tra món đồ trước khi xác nhận.', icon: '🚚' },
  { q: 'Chính sách đổi trả như thế nào?', a: 'Kindr là nền tảng trung gian, không trực tiếp bán hàng hay bảo hành. Tuy nhiên, hệ thống giữ Xu tạm thời giúp bảo vệ quyền lợi của cả hai bên.', icon: '🛡️' },
];

export default function HelpCenterScreen({ navigation }: { navigation: any }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topCard}>
          <Text style={styles.topEmoji}>🧸❓</Text>
          <Text style={styles.topTitle}>Mẹ cần giúp đỡ gì?</Text>
          <Text style={styles.topDesc}>Xem các câu hỏi thường gặp bên dưới hoặc liên hệ admin nhé!</Text>
        </View>
        {faqs.map((faq, i) => (
          <TouchableOpacity key={i} style={styles.faqCard} onPress={() => setExpanded(expanded === i ? null : i)}>
            <View style={styles.faqHeader}>
              <View style={styles.faqIcon}><Text style={styles.faqIconText}>{faq.icon}</Text></View>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color="#8B7E74" />
            </View>
            {expanded === i && <Text style={styles.faqAnswer}>{faq.a}</Text>}
          </TouchableOpacity>
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
  topCard: { marginHorizontal: 20, backgroundColor: '#A3D5C6', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 18 },
  topEmoji: { fontSize: 40, marginBottom: 10 },
  topTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  topDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  faqCard: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  faqIconText: { fontSize: 20 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: '#3D3D3D' },
  faqAnswer: { fontSize: 13, color: '#5D5347', lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F0E8' },
});
