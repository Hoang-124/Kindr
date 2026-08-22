// src/components/common/AddressMapPreview.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Modal 
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { MapPin, Maximize2, CheckCircle2, Crosshair, X, ZoomIn, ZoomOut, Layers } from 'lucide-react-native';

// Coordinates for Districts in Da Nang
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  hc: { lat: 16.0678, lng: 108.2208, name: 'Quận Hải Châu' },
  tk: { lat: 16.0617, lng: 108.1818, name: 'Quận Thanh Khê' },
  st: { lat: 16.0820, lng: 108.2430, name: 'Quận Sơn Trà' },
  nhs: { lat: 16.0286, lng: 108.2520, name: 'Quận Ngũ Hành Sơn' },
  lc: { lat: 16.0690, lng: 108.1470, name: 'Quận Liên Chiểu' },
  cl: { lat: 16.0180, lng: 108.2050, name: 'Quận Cẩm Lệ' },
  hv: { lat: 15.9890, lng: 108.0830, name: 'Huyện Hòa Vang' },
};

// Major streets in Da Nang for instant offline precision matching
const STREET_COORDINATES: Array<{ pattern: RegExp; lat: number; lng: number }> = [
  { pattern: /lê văn hiến/i, lat: 16.0286, lng: 108.2520 },
  { pattern: /nguyễn văn linh/i, lat: 16.0605, lng: 108.2165 },
  { pattern: /hồ xuân hương/i, lat: 16.0390, lng: 108.2460 },
  { pattern: /võ nguyên giáp/i, lat: 16.0590, lng: 108.2470 },
  { pattern: /phạm văn đồng/i, lat: 16.0710, lng: 108.2380 },
  { pattern: /nam kỳ khởi nghĩa/i, lat: 15.9870, lng: 108.2460 },
  { pattern: /trần đại nghĩa/i, lat: 15.9750, lng: 108.2500 },
  { pattern: /mai đăng chơn/i, lat: 15.9920, lng: 108.2420 },
  { pattern: /trần phú/i, lat: 16.0680, lng: 108.2230 },
  { pattern: /bạch đằng/i, lat: 16.0690, lng: 108.2250 },
  { pattern: /hùng vương/i, lat: 16.0695, lng: 108.2190 },
  { pattern: /lê duẩn/i, lat: 16.0710, lng: 108.2190 },
  { pattern: /hoàng diệu/i, lat: 16.0610, lng: 108.2180 },
  { pattern: /phan châu trinh/i, lat: 16.0630, lng: 108.2210 },
  { pattern: /2 tháng 9|2\/9/i, lat: 16.0460, lng: 108.2240 },
  { pattern: /nguyễn hữu thọ/i, lat: 16.0420, lng: 108.2090 },
  { pattern: /trần hưng đạo/i, lat: 16.0680, lng: 108.2320 },
  { pattern: /ngô quyền/i, lat: 16.0750, lng: 108.2360 },
  { pattern: /điện biên phủ/i, lat: 16.0650, lng: 108.1880 },
  { pattern: /hà huy tập/i, lat: 16.0640, lng: 108.1790 },
  { pattern: /trần cao vân/i, lat: 16.0720, lng: 108.1960 },
  { pattern: /nguyễn tất thành/i, lat: 16.0820, lng: 108.1850 },
  { pattern: /tôn đức thắng/i, lat: 16.0610, lng: 108.1560 },
  { pattern: /nguyễn lương bằng/i, lat: 16.0690, lng: 108.1430 },
  { pattern: /âu cơ/i, lat: 16.0590, lng: 108.1380 },
  { pattern: /cách mạng tháng 8|cmt8/i, lat: 16.0240, lng: 108.2090 },
  { pattern: /trường chinh/i, lat: 16.0450, lng: 108.1800 },
  { pattern: /võ chí công/i, lat: 15.9980, lng: 108.2270 },
  { pattern: /nguyễn tri phương/i, lat: 16.0540, lng: 108.2050 },
];

const DEFAULT_COORDS = { lat: 16.0286, lng: 108.2520, name: 'Quận Ngũ Hành Sơn' };

// High-resolution Satellite Hybrid with full street names & labels
const TILE_LAYERS = {
  satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // Google Satellite Hybrid (Ảnh chụp thực tế + Tên đường tiếng Việt)
  street: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', // Google Maps Standard Vector
};

interface AddressMapPreviewProps {
  districtId?: string;
  districtName?: string;
  addressDetail?: string;
  onLocationSelect?: (coords: { lat: number; lng: number; address: string }) => void;
  compact?: boolean;
}

export const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({
  districtId,
  districtName,
  addressDetail = '',
  onLocationSelect,
  compact = true,
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    if (districtId && DISTRICT_COORDINATES[districtId]) {
      return DISTRICT_COORDINATES[districtId];
    }
    return DEFAULT_COORDS;
  });
  const [loading, setLoading] = useState(false);
  const [fullMapVisible, setFullMapVisible] = useState(false);
  const [verifiedAddress, setVerifiedAddress] = useState('Chưa chọn địa chỉ');
  
  // Default to High-Resolution Satellite Hybrid Map for best recognition
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('satellite');

  const mapContainerRef = useRef<any>(null);
  const modalMapContainerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const modalLeafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const modalTileLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const modalMarkerRef = useRef<any>(null);

  // Update coordinates whenever district or detail changes
  useEffect(() => {
    let base = DEFAULT_COORDS;
    if (districtId && DISTRICT_COORDINATES[districtId]) {
      base = DISTRICT_COORDINATES[districtId];
    }

    // Check if matched in street dictionary first
    const matchedStreet = STREET_COORDINATES.find((s) => s.pattern.test(addressDetail.trim()));
    if (matchedStreet) {
      base = { lat: matchedStreet.lat, lng: matchedStreet.lng, name: addressDetail.trim() };
    }

    const fullAddr = [addressDetail.trim(), districtName]
      .filter(Boolean)
      .join(', ');

    setVerifiedAddress(fullAddr || (districtName ? districtName : 'Chưa nhập địa chỉ'));

    // Set coordinates immediately
    setCoords({ lat: base.lat, lng: base.lng });

    if (addressDetail.trim().length > 3) {
      setLoading(true);

      // Geocoding query to OpenStreetMap Nominatim with full city context
      const query = encodeURIComponent([addressDetail.trim(), districtName, 'Đà Nẵng', 'Việt Nam'].filter(Boolean).join(', '));
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

      const controller = new AbortController();
      const timer = setTimeout(() => {
        fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'vi' },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              const newCoords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
              setCoords(newCoords);
              onLocationSelect?.({
                ...newCoords,
                address: fullAddr,
              });
            }
          })
          .catch(() => {
            // Keep base
          })
          .finally(() => setLoading(false));
      }, 400);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }
  }, [districtId, districtName, addressDetail]);

  // Create custom vivid marker pin
  const createPinIcon = (L: any) => {
    return L.divIcon({
      className: 'kindr-custom-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
          <div style="width: 34px; height: 34px; background: #FF4757; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255, 71, 87, 0.6);">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="width: 14px; height: 5px; background: rgba(0,0,0,0.5); border-radius: 50%; margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 40],
    });
  };

  // Initialize and update Preview Leaflet Map directly in Web DOM
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initOrUpdateLeaflet = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        // Create Leaflet Map Instance
        const map = L.map(mapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 17,
          zoomControl: false,
          attributionControl: false,
        });

        // Satellite Hybrid Tile Layer (Google Satellite + Street Labels)
        const tileLayer = L.tileLayer(TILE_LAYERS[mapMode], {
          maxZoom: 20,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        const customIcon = createPinIcon(L);
        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

        // Click on map to reposition pin
        map.on('click', (e: any) => {
          const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
          setCoords(newPos);
          marker.setLatLng(e.latlng);
          onLocationSelect?.({
            ...newPos,
            address: verifiedAddress,
          });
        });

        leafletMapRef.current = map;
        markerRef.current = marker;
      } else {
        // Pan and update existing map
        leafletMapRef.current.setView([coords.lat, coords.lng], 17, { animate: true });
        if (markerRef.current) {
          markerRef.current.setLatLng([coords.lat, coords.lng]);
        }
      }
    };

    if (!(window as any).L) {
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = initOrUpdateLeaflet;
        document.body.appendChild(script);
      }
    } else {
      initOrUpdateLeaflet();
    }
  }, [coords]);

  // Initialize and update Modal Fullscreen Leaflet Map
  useEffect(() => {
    if (Platform.OS !== 'web' || !fullMapVisible) {
      if (modalLeafletMapRef.current) {
        modalLeafletMapRef.current.remove();
        modalLeafletMapRef.current = null;
        modalTileLayerRef.current = null;
        modalMarkerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const L = (window as any).L;
      if (!L || !modalMapContainerRef.current) return;

      if (!modalLeafletMapRef.current) {
        const modalMap = L.map(modalMapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 17,
          zoomControl: false,
          attributionControl: false,
        });

        const layer = L.tileLayer(TILE_LAYERS[mapMode], {
          maxZoom: 20,
        }).addTo(modalMap);

        modalTileLayerRef.current = layer;

        const customIcon = createPinIcon(L);
        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon, draggable: true }).addTo(modalMap);

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
        });

        modalMap.on('click', (e: any) => {
          const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
          setCoords(newPos);
          marker.setLatLng(e.latlng);
          onLocationSelect?.({
            ...newPos,
            address: verifiedAddress,
          });
        });

        modalLeafletMapRef.current = modalMap;
        modalMarkerRef.current = marker;
      } else {
        modalLeafletMapRef.current.invalidateSize();
        modalLeafletMapRef.current.setView([coords.lat, coords.lng], 17);
        if (modalMarkerRef.current) {
          modalMarkerRef.current.setLatLng([coords.lat, coords.lng]);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [fullMapVisible, coords]);

  // Update Tile Layer when mapMode switches
  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    if (leafletMapRef.current && tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(TILE_LAYERS[mapMode], {
        maxZoom: 20,
      }).addTo(leafletMapRef.current);
      tileLayerRef.current = newLayer;
    }

    if (modalLeafletMapRef.current && modalTileLayerRef.current) {
      modalLeafletMapRef.current.removeLayer(modalTileLayerRef.current);
      const newModalLayer = L.tileLayer(TILE_LAYERS[mapMode], {
        maxZoom: 20,
      }).addTo(modalLeafletMapRef.current);
      modalTileLayerRef.current = newModalLayer;
    }
  }, [mapMode]);

  // Request browser GPS position
  const handleGetGPS = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gpsCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCoords(gpsCoords);
          setLoading(false);
          onLocationSelect?.({
            ...gpsCoords,
            address: verifiedAddress,
          });
        },
        () => setLoading(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleZoomIn = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
    if (modalLeafletMapRef.current) {
      modalLeafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
    if (modalLeafletMapRef.current) {
      modalLeafletMapRef.current.zoomOut();
    }
  };

  const toggleMapMode = () => {
    setMapMode((prev) => (prev === 'street' ? 'satellite' : 'street'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <MapPin size={14} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Bản đồ đối chứng địa chỉ</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.gpsBtn, mapMode === 'satellite' && styles.gpsBtnActive]}
            onPress={toggleMapMode}
            activeOpacity={0.7}
          >
            <Layers size={12} color={mapMode === 'satellite' ? '#FFFFFF' : COLORS.primary} />
            <Text style={[styles.gpsBtnText, mapMode === 'satellite' && styles.gpsBtnTextActive]}>
              {mapMode === 'satellite' ? '🛰️ Vệ tinh' : '🗺️ Bản đồ'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.gpsBtn}
            onPress={handleGetGPS}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Crosshair size={12} color={COLORS.primary} />
            <Text style={styles.gpsBtnText}>Vị trí tôi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.expandBtn}
            onPress={() => setFullMapVisible(true)}
            activeOpacity={0.7}
          >
            <Maximize2 size={13} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Card Preview */}
      <View style={[styles.mapCard, compact && styles.mapCardCompact]}>
        {Platform.OS === 'web' ? (
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              zIndex: 1,
            }}
          />
        ) : (
          <View style={styles.mobileFallback}>
            <MapPin size={24} color={COLORS.primary} />
            <Text style={styles.mobileFallbackText}>
              Tọa độ: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Floating Zoom Controls */}
        {Platform.OS === 'web' && (
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
              <ZoomIn size={14} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
              <ZoomOut size={14} color="#1F2937" />
            </TouchableOpacity>
          </View>
        )}

        {/* Real-time Address Pill Overlay */}
        <View style={styles.addressPill}>
          <CheckCircle2 size={12} color="#16A34A" />
          <Text style={styles.addressPillText} numberOfLines={1}>
            {verifiedAddress}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Fullscreen Map Modal */}
      <Modal
        visible={fullMapVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setFullMapVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <MapPin size={18} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Bản đồ đối chứng vị trí Kindr</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.gpsBtn, mapMode === 'satellite' && styles.gpsBtnActive]}
                  onPress={toggleMapMode}
                  activeOpacity={0.7}
                >
                  <Layers size={13} color={mapMode === 'satellite' ? '#FFFFFF' : COLORS.primary} />
                  <Text style={[styles.gpsBtnText, mapMode === 'satellite' && styles.gpsBtnTextActive]}>
                    {mapMode === 'satellite' ? '🛰️ Vệ tinh' : '🗺️ Bản đồ'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => setFullMapVisible(false)}
                >
                  <X size={18} color={COLORS.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalAddressBanner}>
              <Text style={styles.modalAddressLabel}>Địa chỉ đã định vị:</Text>
              <Text style={styles.modalAddressValue}>{verifiedAddress}</Text>
              <Text style={styles.modalCoords}>
                Tọa độ ghim: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </Text>
            </View>

            <View style={styles.modalMapWrap}>
              {Platform.OS === 'web' ? (
                <div
                  ref={modalMapContainerRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                />
              ) : (
                <View style={styles.mobileFallback}>
                  <MapPin size={32} color={COLORS.primary} />
                  <Text style={styles.mobileFallbackText}>Tọa độ: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={() => setFullMapVisible(false)}
            >
              <Text style={styles.confirmBtnText}>Xác nhận vị trí này</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  gpsBtnActive: {
    backgroundColor: COLORS.primary,
  },
  gpsBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.primary,
  },
  gpsBtnTextActive: {
    color: '#FFFFFF',
  },
  expandBtn: {
    padding: 3,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.sm,
  },
  mapCard: {
    width: '100%',
    height: 140,
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(58, 103, 88, 0.15)',
    position: 'relative',
    ...SHADOWS.soft,
  },
  mapCardCompact: {
    height: 110,
  },
  zoomControls: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  zoomBtn: {
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  addressPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(58, 103, 88, 0.15)',
    ...SHADOWS.ambient,
  },
  addressPillText: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  mobileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mobileFallbackText: {
    fontSize: 11,
    color: COLORS.outline,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 10, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    height: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
  },
  modalAddressBanner: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modalAddressLabel: {
    fontSize: 11,
    color: COLORS.outline,
  },
  modalAddressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modalCoords: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  modalMapWrap: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(58, 103, 88, 0.12)',
    marginBottom: SPACING.xs,
  },
  confirmBtn: {
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddressMapPreview;
