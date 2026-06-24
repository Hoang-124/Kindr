// @ts-nocheck
// components/GiftStationScreen.js - Màn hình 23: Trạm Tặng Đồ
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemContext } from '../../../app/providers/ItemProvider';

export default function GiftStationScreen({ navigation }: { navigation: any }) {
  const { items } = useContext(ItemContext);
  const freeItems = items.filter(i => i.xu === 0 && i.status === 'active');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Trạm Tặng Đồ</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🎁✨💕</Text>
          <Text style={styles.bannerTitle}>Cho đi món nhỏ,{'\n'}nhận lại niềm vui lớn</Text>
          <Text style={styles.bannerDesc}>Những món đồ 0 Xu dành tặng cho các gia đình cần</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('PostItem')}>
            <Text style={styles.bannerBtnText}>Đăng đồ tặng 🎁</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Đồ đang chờ chủ mới 💕</Text>
        {freeItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>Chưa có món đồ tặng nào</Text>
            <Text style={styles.emptySubtext}>Mẹ hãy là người đầu tiên tặng đồ nhé!</Text>
          </View>
        ) : (
          freeItems.map(item => (
            <TouchableOpacity key={item.id} style={styles.giftCard} onPress={() => navigation.navigate('ItemDetail', { item })}>
              <Image source={{ uri: item.image }} style={styles.giftImage} />
              <View style={styles.giftInfo}>
                <Text style={styles.giftTitle}>{item.title}</Text>
                <View style={styles.freeBadge}><Text style={styles.freeText}>🎁 0 Xu - Miễn phí</Text></View>
                <Text style={styles.giftLocation}>📍 {item.location}</Text>
                <Text style={styles.giftSeller}>Từ: {item.seller.name}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  banner: { marginHorizontal: 20, backgroundColor: '#FFF0F3', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#FFD6E0' },
  bannerEmoji: { fontSize: 40, marginBottom: 12 },
  bannerTitle: { fontSize: 24, fontWeight: '800', color: '#D4577A', textAlign: 'center', lineHeight: 32, marginBottom: 8 },
  bannerDesc: { fontSize: 14, color: '#8B7E74', textAlign: 'center', marginBottom: 16 },
  bannerBtn: { backgroundColor: '#D4577A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  bannerBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D', paddingHorizontal: 20, marginBottom: 14 },
  giftCard: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  giftImage: { width: 110, height: 110 },
  giftInfo: { flex: 1, padding: 14 },
  giftTitle: { fontSize: 15, fontWeight: '700', color: '#3D3D3D', marginBottom: 6 },
  freeBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF0F3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 6 },
  freeText: { fontSize: 12, fontWeight: '700', color: '#D4577A' },
  giftLocation: { fontSize: 12, color: '#8B7E74', marginBottom: 2 },
  giftSeller: { fontSize: 12, color: '#5B9A8B', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#3D3D3D' },
  emptySubtext: { fontSize: 14, color: '#8B7E74', marginTop: 4 },
});
