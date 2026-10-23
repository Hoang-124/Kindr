// d:\Kindr\web\src\components\Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, MapPin } from 'lucide-react';
import { KindrCoin } from './KindrCoin';

export const Footer: React.FC = () => (
  <footer
    style={{
      backgroundColor: 'var(--color-card)',
      borderTop: '1px solid var(--color-border)',
      padding: 'var(--space-10) var(--space-5)',
      marginTop: 'auto',
    }}
  >
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-8)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <KindrCoin size={24} />
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>
            Kindr Web Platform
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Nền tảng kinh tế tuần hoàn & trao đổi đồ dùng trẻ em siêu cục bộ tại Đà Nẵng.
          Ứng dụng thuật toán Ký quỹ Song phương (Double Escrow) và 6 Giờ Kiểm Định Tại Nhà.
        </p>
      </div>

      <div>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
          3 Trụ Cột Bảo Chứng Kindr
        </h4>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="var(--color-secondary-dark)" />
            <span>Ký quỹ kép: Mua khóa 100% Xu • Bán cọc 10% Safe Fee</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--color-warning)" />
            <span>6 Giờ Kiểm Định Tại Nhà (Safeful Time)</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="var(--color-primary)" />
            <span>Trao đổi siêu cục bộ &lt; 2km tại Đà Nẵng</span>
          </li>
        </ul>
      </div>

      <div>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
          Điều hướng nhanh
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <Link to="/">Khám phá món đồ gần mẹ</Link>
          <Link to="/search">Tìm kiếm & Bản đồ Đà Nẵng</Link>
          <Link to="/donation-station">Trạm Tặng Đồ 0 Xu</Link>
          <Link to="/post">Đăng đồ dọn nhà cho bé</Link>
          <Link to="/wallet">Ví Xu & Nạp/Rút VietQR</Link>
        </div>
      </div>
    </div>

    <div
      style={{
        maxWidth: 1280,
        margin: 'var(--space-8) auto 0',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 12,
        color: 'var(--color-text-muted)',
      }}
    >
      <span>© 2026 Kindr Ecosystem — Đội KBFSHARK (FPT University Đà Nẵng)</span>
      <span>Quy chuẩn tỷ giá: 1 Xu = 10.000 VNĐ • Tuân thủ Nghị định 13/2023/NĐ-CP</span>
    </div>
  </footer>
);
