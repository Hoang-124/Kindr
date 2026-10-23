// d:\Kindr\web\src\components\AddressMapPreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { getDistrictById } from '../utils/locations';
import { Product } from '../types';

interface AddressMapPreviewProps {
  districtId?: string;
  addressDetail?: string;
  lat?: number;
  lng?: number;
  height?: number;
  products?: Product[];
  onSelectProduct?: (productId: string) => void;
  onLocationChange?: (coords: { lat: number; lng: number; address: string }) => void;
}

export const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({
  districtId = 'dn_haichau',
  addressDetail = '',
  lat,
  lng,
  height = 260,
  products = [],
  onSelectProduct,
  onLocationChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const productMarkersRef = useRef<any[]>([]);

  const district = getDistrictById(districtId);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: lat ?? district.lat,
    lng: lng ?? district.lng,
  });
  const [resolvedLabel, setResolvedLabel] = useState<string>(`${district.name}, Đà Nẵng`);

  useEffect(() => {
    const d = getDistrictById(districtId);
    setCoords({ lat: lat ?? d.lat, lng: lng ?? d.lng });
    setResolvedLabel(
      addressDetail.trim()
        ? `${addressDetail.trim()}, ${d.name}, Đà Nẵng`
        : `${d.name}, Đà Nẵng`
    );
  }, [districtId, addressDetail, lat, lng]);

  // Nominatim Geocoding when addressDetail changes
  useEffect(() => {
    if (!addressDetail || addressDetail.trim().length < 4) return;
    const d = getDistrictById(districtId);
    const timer = setTimeout(async () => {
      try {
        const q = encodeURIComponent(`${addressDetail.trim()}, ${d.name}, Đà Nẵng, Việt Nam`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setCoords({ lat, lng });
          onLocationChange?.({
            lat,
            lng,
            address: `${addressDetail.trim()}, ${d.name}, Đà Nẵng`,
          });
        }
      } catch {
        // Fallback to district center
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [addressDetail, districtId, onLocationChange]);

  // Initialize Leaflet Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], { draggable: Boolean(onLocationChange) }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        onLocationChange?.({
          lat: pos.lat,
          lng: pos.lng,
          address: resolvedLabel,
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
      markerRef.current?.setLatLng([coords.lat, coords.lng]);
    }
  }, [coords.lat, coords.lng]);

  // Render product pins if provided
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    productMarkersRef.current.forEach((m) => m.remove());
    productMarkersRef.current = [];

    products.forEach((p, idx) => {
      const lat =
        p.coordinates?.latitude ||
        coords.lat + ((idx % 5) - 2) * 0.0042;
      const lng =
        p.coordinates?.longitude ||
        coords.lng + (((idx * 3) % 5) - 2) * 0.0042;

      const circle = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: '#FF6B6B',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.92,
      }).addTo(map);

      circle.bindPopup(
        `<div style="font-family:Plus Jakarta Sans,sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${p.name}</div>
          <div style="font-weight:800;color:#E05353;font-size:13px">${p.price === 0 ? 'Tặng 0 Xu' : p.price + ' Xu'} • ${p.conditionLabel || 'Mới ' + p.condition + '%'}</div>
          <div style="font-size:12px;color:#6C757D;margin-top:2px">${p.locationName || 'Đà Nẵng'}</div>
        </div>`
      );

      if (onSelectProduct) {
        circle.on('click', () => onSelectProduct(p.id));
      }

      productMarkersRef.current.push(circle);
    });
  }, [products, coords.lat, coords.lng, onSelectProduct]);

  const handleUseMyGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        onLocationChange?.({ lat, lng, address: resolvedLabel });
      },
      () => {}
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        borderRadius: 'var(--radius-default)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            minWidth: 0,
            flex: 1,
          }}
        >
          <MapPin size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {resolvedLabel}
          </span>
        </div>
        <button
          type="button"
          className="kw-btn kw-btn-outline kw-btn-sm"
          onClick={handleUseMyGps}
          style={{ minHeight: 32, padding: '0 10px', fontSize: 11, flexShrink: 0 }}
        >
          <Navigation size={12} />
          Vị trí của tôi
        </button>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          position: 'relative',
          zIndex: 1,
          isolation: 'isolate',
          width: '100%',
          height,
          backgroundColor: 'var(--color-surface-subtle)',
        }}
      />
    </div>
  );
};
