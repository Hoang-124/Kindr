// @ts-nocheck
// components/MapNearbyScreen.tsx - Màn hình 24: Bản đồ quanh đây (Mặc định / Web Fallback)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockMarkersWeb = [
  { id: '1', name: 'Xe đẩy Combi đời 2024', xu: 12, district: 'Quận 7', x: 120, y: 120, type: 'xe_noi' },
  { id: '2', name: 'Bộ xếp hình Lego Duplo', xu: 5, district: 'Bình Thạnh', x: 200, y: 80, type: 'do_choi' },
  { id: '3', name: 'Sách vải Montessori', xu: 3, district: 'Quận 2', x: 260, y: 160, type: 'sach_truyen' },
  { id: '4', name: 'Bộ quần áo bé gái', xu: 4, district: 'Gò Vấp', x: 80, y: 200, type: 'quan_ao' },
  { id: '5', name: 'Gấu bông Teddy lớn', xu: 0, district: 'Quận 7', x: 170, y: 240, type: 'tram_tang' },
];

export default function MapNearbyScreen({ navigation }: { navigation: any }) {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản đồ Quanh đây (Web Demo)</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Map Mock View */}
      <View style={styles.mapContainer}>
        {/* Web Google Maps Embed */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.9540026217435!2d106.719656175704!3d10.729227189417436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f9cdb84f3df%3A0xbc26d36e2f12f0e0!2zTOG7k3R0ZSBNYXJ0IFF14bqtbiA3!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn"
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 22 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoEmoji}>📍</Text>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>
            {selectedMarker ? selectedMarker.name : 'Khám phá quanh mẹ'}
          </Text>
          <Text style={styles.infoText}>
            {selectedMarker 
              ? `Món đồ này đang ở khu vực ${selectedMarker.district}, cách vị trí của mẹ dưới 1km.`
              : 'Nhấp chọn một ghim đồ chơi/quà tặng trên bản đồ để xem chi tiết.'}
          </Text>
        </View>
      </View>

      {/* Preview list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
        {mockMarkersWeb.map(m => (
          <TouchableOpacity 
            key={m.id} 
            style={[styles.previewCard, selectedMarker?.id === m.id && styles.previewCardActive]}
            onPress={() => setSelectedMarker(m)}
          >
            <View style={styles.previewIcon}>
              <Text style={styles.previewEmoji}>
                {m.xu === 0 ? '🎁' : m.type === 'xe_noi' ? '🍼' : '🧸'}
              </Text>
            </View>
            <Text style={styles.previewName} numberOfLines={1}>{m.name}</Text>
            <Text style={styles.previewXu}>{m.xu === 0 ? 'Miễn phí' : `${m.xu} Xu`}</Text>
            <Text style={styles.previewDistrict}>{m.district}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  
  // Map Container
  mapContainer: { flex: 1, marginHorizontal: 20, marginBottom: 10, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E8E3DB' },

  // Web Fallback styles
  mapBgWeb: { flex: 1, backgroundColor: '#E8F5E8', position: 'relative', overflow: 'hidden' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(163,213,198,0.2)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(163,213,198,0.2)' },
  markerWeb: { position: 'absolute', alignItems: 'center' },
  markerDotWeb: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5B9A8B', justifyContent: 'center', alignItems: 'center', shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  markerDotFreeWeb: { backgroundColor: '#D4577A' },
  markerTextWeb: { fontSize: 16 },
  markerLabelWeb: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2, borderWidth: 1, borderColor: '#E8E3DB' },
  markerLabelTextWeb: { fontSize: 9, fontWeight: '700', color: '#3D3D3D' },
  centerIndicatorWeb: { position: 'absolute', top: '45%', left: '45%' },
  centerEmojiWeb: { fontSize: 26 },

  // Info Card
  infoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E8E3DB' },
  infoEmoji: { fontSize: 24, marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '800', color: '#3D3D3D', marginBottom: 2 },
  infoText: { fontSize: 12, color: '#8B7E74', lineHeight: 16 },
  
  // Preview Scroll
  previewScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  previewCard: { width: 130, backgroundColor: '#ffffff', borderRadius: 16, padding: 12, marginRight: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E3DB' },
  previewCardActive: { borderColor: '#5B9A8B', backgroundColor: '#F0FAF7' },
  previewIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  previewEmoji: { fontSize: 22 },
  previewName: { fontSize: 12, fontWeight: '700', color: '#3D3D3D', marginBottom: 4, textAlign: 'center' },
  previewXu: { fontSize: 12, fontWeight: '700', color: '#8B6914', marginBottom: 2 },
  previewDistrict: { fontSize: 10, color: '#8B7E74' },
});
