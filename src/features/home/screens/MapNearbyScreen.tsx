// @ts-nocheck
// components/MapNearbyScreen.js - Màn hình 24: Bản đồ quanh đây
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dynamically import native packages only on mobile to prevent web bundler crash
let MapView = null;
let Marker = null;
let Location = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Location = require('expo-location');
  } catch (error) {
    console.warn('Failed to load native maps or location modules', error);
  }
}

const mockMarkersWeb = [
  { id: '1', name: 'Xe đẩy Combi đời 2024', xu: 12, district: 'Quận 7', x: 120, y: 120, type: 'xe_noi' },
  { id: '2', name: 'Bộ xếp hình Lego Duplo', xu: 5, district: 'Bình Thạnh', x: 200, y: 80, type: 'do_choi' },
  { id: '3', name: 'Sách vải Montessori', xu: 3, district: 'Quận 2', x: 260, y: 160, type: 'sach_truyen' },
  { id: '4', name: 'Bộ quần áo bé gái', xu: 4, district: 'Gò Vấp', x: 80, y: 200, type: 'quan_ao' },
  { id: '5', name: 'Gấu bông Teddy lớn', xu: 0, district: 'Quận 7', x: 170, y: 240, type: 'tram_tang' },
];

export default function MapNearbyScreen({ navigation }: { navigation: any }) {
  const [userCoords, setUserCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(Platform.OS !== 'web');
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !Location) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserCoords({ latitude: 10.7292, longitude: 106.7212 });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setUserCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting location: ', error);
        setUserCoords({ latitude: 10.7292, longitude: 106.7212 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getNearbyMarkers = (lat: number, lng: number) => {
    return [
      { id: '1', name: 'Xe đẩy Combi đời 2024', xu: 12, district: 'Quận 7', latitude: lat + 0.002, longitude: lng - 0.003, type: 'xe_noi' },
      { id: '2', name: 'Bộ xếp hình Lego Duplo', xu: 5, district: 'Bình Thạnh', latitude: lat - 0.003, longitude: lng + 0.002, type: 'do_choi' },
      { id: '3', name: 'Sách vải Montessori', xu: 3, district: 'Quận 2', latitude: lat + 0.003, longitude: lng + 0.003, type: 'sach_truyen' },
      { id: '4', name: 'Bộ quần áo bé gái', xu: 4, district: 'Gò Vấp', latitude: lat - 0.002, longitude: lng - 0.004, type: 'quan_ao' },
      { id: '5', name: 'Gấu bông Teddy lớn', xu: 0, district: 'Quận 7', latitude: lat + 0.004, longitude: lng - 0.001, type: 'tram_tang' },
    ];
  };

  const markers = Platform.OS === 'web' 
    ? mockMarkersWeb 
    : (userCoords ? getNearbyMarkers(userCoords.latitude, userCoords.longitude) : []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản đồ Quanh đây</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Map View */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B9A8B" />
          <Text style={styles.loadingText}>Đang dò tìm GPS & Tải bản đồ...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' || !MapView ? (
            /* Web Fallback Mock Map */
            <View style={styles.mapBgWeb}>
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => <View key={`h${i}`} style={[styles.gridLineH, { top: 80 * i + 40 }]} />)}
              {[0, 1, 2, 3].map(i => <View key={`v${i}`} style={[styles.gridLineV, { left: 80 * i + 40 }]} />)}

              {/* Markers */}
              {markers.map(m => (
                <TouchableOpacity 
                  key={m.id} 
                  style={[styles.markerWeb, { left: m.x, top: m.y }]}
                  onPress={() => setSelectedMarker(m)}
                >
                  <View style={[styles.markerDotWeb, m.xu === 0 && styles.markerDotFreeWeb]}>
                    <Text style={styles.markerTextWeb}>{m.xu === 0 ? '🎁' : '🧸'}</Text>
                  </View>
                  <View style={styles.markerLabelWeb}>
                    <Text style={styles.markerLabelTextWeb}>{m.xu === 0 ? 'Tặng' : `${m.xu} Xu`}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Center indicator */}
              <View style={styles.centerIndicatorWeb}>
                <Text style={styles.centerEmojiWeb}>📍</Text>
              </View>
            </View>
          ) : (
            /* Real Mobile MapView */
            <MapView
              style={styles.map}
              showsUserLocation={true}
              showsMyLocationButton={true}
              initialRegion={{
                latitude: userCoords ? userCoords.latitude : 10.7292,
                longitude: userCoords ? userCoords.longitude : 106.7212,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
            >
              {markers.map(m => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                  onPress={() => setSelectedMarker(m)}
                >
                  <View style={styles.customMarker}>
                    <Text style={styles.markerEmoji}>
                      {m.xu === 0 ? '🎁' : '🧸'}
                    </Text>
                    <View style={styles.markerBubble}>
                      <Text style={styles.markerBubbleText}>
                        {m.xu === 0 ? 'Tặng' : `${m.xu} Xu`}
                      </Text>
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          )}
        </View>
      )}

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
        {markers.map(m => (
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
  
  // Loading state
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#ffffff', borderRadius: 24 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#8B7E74' },

  // Map Container
  mapContainer: { flex: 1, marginHorizontal: 20, marginBottom: 10, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E8E3DB' },
  map: { width: '100%', height: '100%' },

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
  
  // Custom Mobile Marker styles
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  markerBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#5B9A8B',
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  markerBubbleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5B9A8B',
  },

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
