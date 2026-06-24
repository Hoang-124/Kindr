// @ts-nocheck
// components/MapNearbyScreen.js - Màn hình 24: Bản đồ quanh đây
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockMarkers = [
  { id: '1', name: 'Xe đẩy Combi', xu: 12, district: 'Quận 7', x: 120, y: 150 },
  { id: '2', name: 'Bộ Lego Duplo', xu: 5, district: 'Bình Thạnh', x: 200, y: 100 },
  { id: '3', name: 'Sách vải', xu: 3, district: 'Quận 2', x: 260, y: 200 },
  { id: '4', name: 'Quần áo bé', xu: 4, district: 'Gò Vấp', x: 80, y: 250 },
  { id: '5', name: 'Gấu bông', xu: 0, district: 'Quận 7', x: 170, y: 280 },
];

export default function MapNearbyScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quanh đây</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Map Mock */}
      <View style={styles.mapContainer}>
        <View style={styles.mapBg}>
          {/* Grid lines */}
          {[0,1,2,3].map(i => <View key={`h${i}`} style={[styles.gridLineH, { top: 80 * i + 40 }]} />)}
          {[0,1,2,3].map(i => <View key={`v${i}`} style={[styles.gridLineV, { left: 80 * i + 40 }]} />)}

          {/* Markers */}
          {mockMarkers.map(m => (
            <TouchableOpacity key={m.id} style={[styles.marker, { left: m.x, top: m.y }]}>
              <View style={[styles.markerDot, m.xu === 0 && styles.markerDotFree]}>
                <Text style={styles.markerText}>{m.xu === 0 ? '🎁' : '📦'}</Text>
              </View>
              <View style={styles.markerLabel}><Text style={styles.markerLabelText}>{m.xu} Xu</Text></View>
            </TouchableOpacity>
          ))}

          {/* Center indicator */}
          <View style={styles.centerIndicator}>
            <Text style={styles.centerEmoji}>📍</Text>
          </View>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoEmoji}>📍</Text>
        <Text style={styles.infoText}>Có 45 món đồ quanh phường của mẹ đang chờ được đổi!</Text>
      </View>

      {/* Preview list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
        {mockMarkers.map(m => (
          <TouchableOpacity key={m.id} style={styles.previewCard}>
            <View style={styles.previewIcon}><Text style={styles.previewEmoji}>{m.xu === 0 ? '🎁' : '📦'}</Text></View>
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
  mapContainer: { flex: 1, marginHorizontal: 20, marginBottom: 10 },
  mapBg: { flex: 1, backgroundColor: '#E8F5E8', borderRadius: 24, position: 'relative', overflow: 'hidden' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(163,213,198,0.3)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(163,213,198,0.3)' },
  marker: { position: 'absolute', alignItems: 'center' },
  markerDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B9A8B', justifyContent: 'center', alignItems: 'center', shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  markerDotFree: { backgroundColor: '#D4577A' },
  markerText: { fontSize: 18 },
  markerLabel: { backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  markerLabelText: { fontSize: 10, fontWeight: '700', color: '#3D3D3D' },
  centerIndicator: { position: 'absolute', top: '45%', left: '45%' },
  centerEmoji: { fontSize: 30 },
  infoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10 },
  infoEmoji: { fontSize: 22, marginRight: 10 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#3D3D3D' },
  previewScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  previewCard: { width: 130, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginRight: 10, alignItems: 'center' },
  previewIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  previewEmoji: { fontSize: 22 },
  previewName: { fontSize: 12, fontWeight: '700', color: '#3D3D3D', marginBottom: 4, textAlign: 'center' },
  previewXu: { fontSize: 12, fontWeight: '700', color: '#8B6914', marginBottom: 2 },
  previewDistrict: { fontSize: 10, color: '#8B7E74' },
});
