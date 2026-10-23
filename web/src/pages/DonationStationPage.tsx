// d:\Kindr\web\src\pages\DonationStationPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  MapPin,
  Clock,
  Phone,
  HeartHandshake,
  PlusCircle,
  CalendarCheck,
  Eye,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { MascotIcon } from '../components/KindrCoin';
import { AddressMapPreview } from '../components/AddressMapPreview';

interface StationInfo {
  id: string;
  name: string;
  districtId: string;
  address: string;
  hours: string;
  hotline: string;
  itemsAvailable: number;
  image: string;
  lat: number;
  lng: number;
}

const STATIONS: StationInfo[] = [
  {
    id: 'st_haichau',
    name: 'Trạm Tặng Đồ Kindr Hub #1 — Hải Châu',
    districtId: 'dn_haichau',
    address: 'Số 112 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    hours: '08:00 – 20:00 (Thứ 2 – Chủ Nhật)',
    hotline: '0905 111 222',
    itemsAvailable: 28,
    image:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
    lat: 16.0604,
    lng: 108.2156,
  },
  {
    id: 'st_nguhanhson',
    name: 'Trạm Tặng Đồ Kindr Hub #2 — Sảnh FPT Plaza 2',
    districtId: 'dn_nguhanhson',
    address: 'Khu đô thị FPT City, Phường Hòa Hải, Quận Ngũ Hành Sơn, Đà Nẵng',
    hours: '08:30 – 21:00 (Thứ 2 – Chủ Nhật)',
    hotline: '0905 333 444',
    itemsAvailable: 42,
    image:
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80',
    lat: 15.9789,
    lng: 108.2615,
  },
  {
    id: 'st_sontra',
    name: 'Trạm Tặng Đồ Kindr Hub #3 — Sơn Trà',
    districtId: 'dn_sontra',
    address: 'Số 45 Phạm Văn Đồng, Phường An Hải Bắc, Quận Sơn Trà, Đà Nẵng',
    hours: '08:00 – 19:30 (Thứ 2 – Thứ 7)',
    hotline: '0905 555 666',
    itemsAvailable: 19,
    image:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
    lat: 16.0712,
    lng: 108.2385,
  },
];

export const DonationStationPage: React.FC = () => {
  const { products, currentUser, showToast } = useApp();

  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [bookingStation, setBookingStation] = useState<StationInfo | null>(null);
  const [bookingDate, setBookingDate] = useState('Hôm nay (16:00 - 18:00)');
  const [bookingItems, setBookingItems] = useState('');
  const [bookingPhone, setBookingPhone] = useState(currentUser?.phone || '');
  const [activeMapStation, setActiveMapStation] = useState<StationInfo>(STATIONS[0]);

  const charityProducts = products.filter(
    (p) =>
      p.status === 'available' &&
      (p.price === 0 || p.category === 'charity' || p.category === 'tu_thien')
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingStation) return;
    showToast({
      title: 'Đăng ký ký gửi tại Trạm thành công!',
      message: `Trạm ${bookingStation.name} đã ghi nhận lịch hẹn (${bookingDate}). Nhân viên sẽ hỗ trợ khử khuẩn UV-C miễn phí!`,
      type: 'success',
    });
    setBookingStation(null);
    setBookingItems('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Hero Banner */}
      <div
        className="kw-card"
        style={{
          background:
            'linear-gradient(135deg, var(--color-secondary-light) 0%, var(--color-card) 100%)',
          borderColor: 'var(--color-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <span className="kw-badge kw-badge-teal" style={{ marginBottom: 10 }}>
            <HeartHandshake size={14} /> Sẻ Chia Yêu Thương • 0 Xu • Miễn Cọc Safe Fee
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10 }}>
            Trạm Tặng Đồ Kindr (0 Xu) tại Đà Nẵng
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Những món đồ chơi, quần áo sơ sinh, sách truyện được các mẹ bỉm Đà Nẵng gửi tặng hoàn toàn miễn phí (0 Xu).
            Khi đăng tặng đồ 0 Xu, mẹ được <strong>miễn 100% cọc Safe Fee</strong> và được cộng Điểm Văn Minh sau mỗi lượt trao tặng!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/post?charity=1" className="kw-btn kw-btn-primary kw-btn-lg">
            <PlusCircle size={18} />
            <span>Đăng Tặng Đồ 0 Xu Ngay</span>
          </Link>
        </div>
      </div>

      {/* 3 Physical Stations with High-Res Photos & Interactive Modals */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>
              Hệ thống 3 Điểm Trạm Tiếp Nhận & Khử Khuẩn UV-C (Kindr Hub)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Mẹ có thể mang đồ đến ký gửi trực tiếp hoặc xem các món đồ 0 Xu đang có sẵn tại từng trạm
            </p>
          </div>
        </div>

        <div className="kw-grid-3">
          {STATIONS.map((st) => (
            <div
              key={st.id}
              className="kw-card kw-card-flush"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ position: 'relative', height: 185, overflow: 'hidden' }}>
                  <img
                    src={st.image}
                    alt={st.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                    }}
                  >
                    <span className="kw-badge kw-badge-coral" style={{ boxShadow: 'var(--shadow-soft)' }}>
                      <Gift size={13} /> Đang có {st.itemsAvailable} món 0 Xu
                    </span>
                  </div>
                </div>

                <div style={{ padding: '18px 20px 14px' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{st.name}</h3>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <MapPin
                        size={15}
                        color="var(--color-primary)"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span>{st.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={15} color="var(--color-secondary-dark)" />
                      <span>{st.hours}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={15} color="var(--color-warning)" />
                      <span>Hotline trạm: {st.hotline}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px 18px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStation(st)}
                    className="kw-btn kw-btn-outline kw-btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye size={15} />
                    <span>Xem đồ tại trạm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStation(st);
                      setBookingPhone(currentUser?.phone || '');
                    }}
                    className="kw-btn kw-btn-primary kw-btn-sm"
                    style={{ flex: 1 }}
                  >
                    <CalendarCheck size={15} />
                    <span>Đăng ký ký gửi</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMapStation(st)}
                  className="kw-btn kw-btn-ghost kw-btn-sm"
                  style={{ minHeight: 34, fontSize: 12 }}
                >
                  <MapPin size={14} color="var(--color-secondary-dark)" />
                  <span>Định vị trạm trên bản đồ Đà Nẵng</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map of Selected Kindr Hub Station */}
      <div className="kw-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>
              Bản đồ định vị: {activeMapStation.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {activeMapStation.address}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATIONS.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveMapStation(st)}
                className={`kw-btn kw-btn-sm ${
                  activeMapStation.id === st.id ? 'kw-btn-primary' : 'kw-btn-outline'
                }`}
              >
                Trạm #{idx + 1}
              </button>
            ))}
          </div>
        </div>
        <AddressMapPreview
          districtId={activeMapStation.districtId}
          addressDetail={activeMapStation.address}
          lat={activeMapStation.lat}
          lng={activeMapStation.lng}
          height={260}
        />
      </div>

      {/* Live 0-Xu Products Feed */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Món đồ 0 Xu đang mở tặng trực tuyến ({charityProducts.length})
        </h2>
        {charityProducts.length === 0 ? (
          <div className="kw-card" style={{ textAlign: 'center', padding: 48 }}>
            <MascotIcon
              size={56}
              dialogue="Hiện chưa có món đồ 0 Xu nào trên kệ trực tuyến. Mẹ hãy là người đầu tiên sẻ chia món đồ của bé nhé!"
            />
            <div style={{ marginTop: 16 }}>
              <Link to="/post?charity=1" className="kw-btn kw-btn-primary">
                Đăng tặng món đồ đầu tiên
              </Link>
            </div>
          </div>
        ) : (
          <div className="kw-grid-4">
            {charityProducts.map((p) => (
              <ProductCard key={p.id} product={p} currentUserId={currentUser?.id} />
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: View Station 0-Xu Items */}
      {selectedStation && (
        <div className="kw-modal-backdrop" onClick={() => setSelectedStation(null)}>
          <div
            className="kw-modal-box"
            style={{ maxWidth: 680 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span className="kw-badge kw-badge-teal">
                <ShieldCheck size={14} /> Đã khử khuẩn tia UV-C tại trạm
              </span>
              <button
                type="button"
                onClick={() => setSelectedStation(null)}
                className="kw-btn kw-btn-ghost kw-btn-sm"
                style={{ minHeight: 36, padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {selectedStation.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Địa chỉ: {selectedStation.address} • Giờ mở cửa: {selectedStation.hours}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
                maxHeight: 380,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {charityProducts.map((item) => (
                <ProductCard key={item.id} product={item} currentUserId={currentUser?.id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Book Drop-off Appointment at Kindr Hub */}
      {bookingStation && (
        <div className="kw-modal-backdrop" onClick={() => setBookingStation(null)}>
          <form
            className="kw-modal-box"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleBookingSubmit}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span className="kw-badge kw-badge-coral">
                <CalendarCheck size={14} /> Đặt lịch ký gửi & khử khuẩn UV-C
              </span>
              <button
                type="button"
                onClick={() => setBookingStation(null)}
                className="kw-btn kw-btn-ghost kw-btn-sm"
                style={{ minHeight: 36, padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              Đăng ký mang đồ đến {bookingStation.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Nhân viên Kindr Hub sẽ tiếp nhận, phân loại, chụp ảnh và khử khuẩn bằng tủ tia UV-C hoàn toàn miễn phí.
            </p>

            <div className="kw-field">
              <label className="kw-label">Khung giờ mẹ dự kiến ghé trạm *</label>
              <select
                className="kw-select"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              >
                <option value="Hôm nay (16:00 - 18:00)">Hôm nay (16:00 - 18:00)</option>
                <option value="Sáng mai (08:30 - 11:30)">Sáng mai (08:30 - 11:30)</option>
                <option value="Chiều mai (14:00 - 18:00)">Chiều mai (14:00 - 18:00)</option>
                <option value="Cuối tuần này (Thứ 7 / Chủ Nhật)">Cuối tuần này (Thứ 7 / Chủ Nhật)</option>
              </select>
            </div>

            <div className="kw-field">
              <label className="kw-label">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                className="kw-input"
                placeholder="VD: 0905123456"
                value={bookingPhone}
                onChange={(e) => setBookingPhone(e.target.value)}
                required
              />
            </div>

            <div className="kw-field">
              <label className="kw-label">Các món đồ mẹ dự kiến gửi tặng *</label>
              <textarea
                className="kw-textarea"
                placeholder="VD: 5 bộ body sơ sinh, 1 xe tập đi gỗ, 3 cuốn truyện Ehon..."
                value={bookingItems}
                onChange={(e) => setBookingItems(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setBookingStation(null)}
                className="kw-btn kw-btn-outline"
                style={{ flex: 1 }}
              >
                Hủy
              </button>
              <button type="submit" className="kw-btn kw-btn-primary" style={{ flex: 2 }}>
                <CheckCircle2 size={17} />
                <span>Xác nhận lịch hẹn ký gửi</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
