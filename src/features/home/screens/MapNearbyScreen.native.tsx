// @ts-nocheck
// components/MapNearbyScreen.native.tsx - Màn hình 24: Bản đồ quanh đây (Dành riêng cho Mobile)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapNearbyScreen({ navigation }: { navigation: any }) {
  const [userCoords, setUserCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  useEffect(() => {
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

  const markers = userCoords ? getNearbyMarkers(userCoords.latitude, userCoords.longitude) : [];

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
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={true}
            initialRegion={{
              latitude: userCoords!.latitude,
              longitude: userCoords!.longitude,
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
              ? `Món đồ này đang cách vị trí của mẹ dưới 1km.`
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
