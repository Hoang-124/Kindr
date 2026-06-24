// @ts-nocheck
// components/TransactionDetailScreen.js - Màn hình 15: Chi tiết giao dịch
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const timelineSteps = [
  { label: 'Yêu cầu nhận đồ', status: 'done', icon: '📋', time: '10:30 - 01/02/2024' },
  { label: 'Người đăng xác nhận', status: 'done', icon: '✅', time: '11:00 - 01/02/2024' },
  { label: 'Gấu đang giữ Xu', status: 'current', icon: '🧸', time: '11:05 - 01/02/2024' },
  { label: 'Đang hẹn giao nhận', status: 'pending', icon: '🤝', time: '' },
  { label: 'Chờ xác nhận đã nhận đồ', status: 'pending', icon: '📦', time: '' },
  { label: 'Hoàn tất', status: 'pending', icon: '🎉', time: '' },
];

export default function TransactionDetailScreen({ navigation, route }: { navigation: any, route: any }) {
  const item = route?.params?.item || { title: 'Xe đẩy Combi', xu: 12, image: '', seller: { name: 'Mẹ Bống', avatar: 'B' } };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Item summary */}
        <View style={styles.itemCard}>
          <View style={styles.itemIcon}><Text style={styles.itemEmoji}>📦</Text></View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemXu}>🪙 {item.xu} Xu</Text>
          </View>
        </View>

        {/* People involved */}
        <View style={styles.peopleRow}>
          <View style={styles.personCard}>
            <View style={styles.personAvatar}><Text style={styles.personAvatarText}>{item.seller?.avatar || 'B'}</Text></View>
            <Text style={styles.personName}>{item.seller?.name || 'Mẹ Bống'}</Text>
            <Text style={styles.personRole}>Người đăng</Text>
          </View>
          <View style={styles.arrowContainer}><Text style={styles.arrowEmoji}>↔️</Text></View>
          <View style={styles.personCard}>
            <View style={[styles.personAvatar, { backgroundColor: '#F5C8B2' }]}><Text style={styles.personAvatarText}>T</Text></View>
            <Text style={styles.personName}>Bạn</Text>
            <Text style={styles.personRole}>Người nhận</Text>
          </View>
        </View>

        {/* Xu being held */}
        <View style={styles.escrowCard}>
          <Text style={styles.escrowEmoji}>🧸</Text>
          <View>
            <Text style={styles.escrowLabel}>Gấu đang giữ Xu giúp mẹ</Text>
            <Text style={styles.escrowAmount}>🪙 {item.xu} Xu</Text>
          </View>
        </View>

        {/* Graphical Escrow Progress Pipeline */}
        <View style={styles.pipelineCard}>
          <Text style={styles.pipelineTitle}>Quy trình bảo chứng giao dịch 🛡️</Text>
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineNode, styles.nodeActive]}><Text style={styles.nodeText}>1</Text></View>
              <Text style={styles.pipelineStepLabel}>Cọc Xu</Text>
            </View>
            <View style={[styles.pipelineConnector, styles.connectorActive]} />

            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineNode, styles.nodeActive]}><Text style={styles.nodeText}>2</Text></View>
              <Text style={styles.pipelineStepLabel}>Cọc Phí</Text>
            </View>
            <View style={[styles.pipelineConnector, styles.connectorActive]} />

            <View style={styles.pipelineStep}>
              <View style={[styles.pipelineNode, styles.nodeActive, { backgroundColor: '#F5A623' }]}><Text style={styles.nodeText}>🧸</Text></View>
              <Text style={[styles.pipelineStepLabel, { color: '#F5A623', fontWeight: '700' }]}>Gấu Giữ</Text>
            </View>
            <View style={styles.pipelineConnector} />

            <View style={styles.pipelineStep}>
              <View style={styles.pipelineNode}><Text style={styles.nodeText}>4</Text></View>
              <Text style={styles.pipelineStepLabel}>Nhận đồ</Text>
            </View>
            <View style={styles.pipelineConnector} />

            <View style={styles.pipelineStep}>
              <View style={styles.pipelineNode}><Text style={styles.nodeText}>5</Text></View>
              <Text style={styles.pipelineStepLabel}>Hoàn tất</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Trạng thái giao dịch</Text>
          {timelineSteps.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.status === 'done' && styles.timelineDotDone, step.status === 'current' && styles.timelineDotCurrent]}>
                  <Text style={styles.timelineDotText}>{step.status === 'done' ? '✓' : step.status === 'current' ? '●' : ''}</Text>
                </View>
                {i < timelineSteps.length - 1 && <View style={[styles.timelineLine, step.status === 'done' && styles.timelineLineDone]} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineLabelRow}>
                  <Text style={styles.timelineIcon}>{step.icon}</Text>
                  <Text style={[styles.timelineLabel, step.status === 'current' && styles.timelineLabelActive]}>{step.label}</Text>
                </View>
                {step.time ? <Text style={styles.timelineTime}>{step.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { item })}>
            <Ionicons name="chatbubble-outline" size={20} color="#5B9A8B" />
            <Text style={styles.chatBtnText}>Nhắn tin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => navigation.navigate('ConfirmReceive', { item })}>
            <Text style={styles.confirmBtnText}>Tôi đã nhận đồ ✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('Dispute', { item })}>
            <Text style={styles.reportBtnText}>Có vấn đề cần báo ⚠️</Text>
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
  itemCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 14 },
  itemIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemEmoji: { fontSize: 26 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#3D3D3D', marginBottom: 4 },
  itemXu: { fontSize: 14, fontWeight: '700', color: '#8B6914' },
  peopleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 14, gap: 12 },
  personCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, alignItems: 'center' },
  personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#A3D5C6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  personAvatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  personName: { fontSize: 14, fontWeight: '700', color: '#3D3D3D' },
  personRole: { fontSize: 11, color: '#8B7E74', marginTop: 2 },
  arrowContainer: { paddingHorizontal: 4 },
  arrowEmoji: { fontSize: 20 },
  escrowCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#FFF8EB', borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1.5, borderColor: '#FFE0A3', gap: 12 },
  escrowEmoji: { fontSize: 32 },
  escrowLabel: { fontSize: 13, color: '#8B6914', fontWeight: '600' },
  escrowAmount: { fontSize: 18, fontWeight: '800', color: '#8B6914', marginTop: 2 },
  timelineSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D', marginBottom: 16 },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E8E3DB', justifyContent: 'center', alignItems: 'center' },
  timelineDotDone: { backgroundColor: '#5B9A8B' },
  timelineDotCurrent: { backgroundColor: '#F5A623', borderWidth: 3, borderColor: '#FFE0A3' },
  timelineDotText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E8E3DB', marginVertical: 2 },
  timelineLineDone: { backgroundColor: '#A3D5C6' },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineIcon: { fontSize: 16 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#5D5347' },
  timelineLabelActive: { color: '#3D3D3D', fontWeight: '800' },
  timelineTime: { fontSize: 11, color: '#8B7E74', marginTop: 3 },
  actionSection: { paddingHorizontal: 20, gap: 10 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#A3D5C6' },
  chatBtnText: { fontSize: 15, fontWeight: '700', color: '#5B9A8B' },
  confirmBtn: { backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  reportBtn: { backgroundColor: '#FFF0F3', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD6E0' },
  reportBtnText: { fontSize: 14, fontWeight: '700', color: '#D4577A' },
  pipelineCard: {
    marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  pipelineTitle: { fontSize: 13, fontWeight: '700', color: '#3D3D3D', marginBottom: 12 },
  pipelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pipelineStep: { alignItems: 'center', width: 50 },
  pipelineNode: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8E3DB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  nodeActive: { backgroundColor: '#5B9A8B' },
  nodeText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  pipelineStepLabel: { fontSize: 9, color: '#8B7E74', fontWeight: '600', textAlign: 'center' },
  pipelineConnector: { flex: 1, height: 2, backgroundColor: '#E8E3DB', marginTop: -14 },
  connectorActive: { backgroundColor: '#5B9A8B' },
});
