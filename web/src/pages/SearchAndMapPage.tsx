// d:\Kindr\web\src\pages\SearchAndMapPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, MapPin, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { AddressMapPreview } from '../components/AddressMapPreview';
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '../utils/pricing';
import { DANANG_DISTRICTS } from '../utils/locations';

export const SearchAndMapPage: React.FC = () => {
  const { products, currentUser } = useApp();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [districtId, setDistrictId] = useState('all');
  const [condition, setCondition] = useState('all');
  const [minXu, setMinXu] = useState('');
  const [maxXu, setMaxXu] = useState('');

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.status === 'available')
      .filter((p) => {
        if (!keyword.trim()) return true;
        const q = keyword.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.locationName || '').toLowerCase().includes(q)
        );
      })
      .filter((p) => {
        if (category === 'all') return true;
        if (category === 'toy_small') return p.category === 'toy_small' || p.category === 'do_choi';
        if (category === 'book') return p.category === 'book' || p.category === 'sach_truyen';
        if (category === 'charity') return p.category === 'charity' || p.category === 'tu_thien' || p.price === 0;
        return p.category === category;
      })
      .filter((p) => {
        if (districtId === 'all') return true;
        const dObj = DANANG_DISTRICTS.find((d) => d.id === districtId);
        return (
          p.districtId === districtId ||
          (dObj && (p.locationName || '').toLowerCase().includes(dObj.name.replace('Quận ', '').toLowerCase()))
        );
      })
      .filter((p) => (condition === 'all' ? true : p.condition === condition))
      .filter((p) => {
        const min = minXu !== '' ? Number(minXu) : null;
        const max = maxXu !== '' ? Number(maxXu) : null;
        if (min !== null && !Number.isNaN(min) && p.price < min) return false;
        if (max !== null && !Number.isNaN(max) && p.price > max) return false;
        return true;
      });
  }, [products, keyword, category, districtId, condition, minXu, maxXu]);

  const handleReset = () => {
    setKeyword('');
    setCategory('all');
    setDistrictId('all');
    setCondition('all');
    setMinXu('');
    setMaxXu('');
  };

  return (
    <div className="kw-admin-layout">
      {/* Left Filter Sidebar */}
      <aside className="kw-card" style={{ alignSelf: 'start' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} color="var(--color-primary)" />
            <span>Bộ lọc Siêu Cục Bộ</span>
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="kw-btn kw-btn-ghost kw-btn-sm"
            style={{ minHeight: 34, padding: '0 10px', fontSize: 12 }}
          >
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>

        <div className="kw-field">
          <label className="kw-label">Từ khóa món đồ</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="kw-input"
              placeholder="VD: Xe đẩy, Lego, sách..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 12, top: 16 }}
            />
          </div>
        </div>

        <div className="kw-search-filter-pair">
          <div className="kw-field">
            <label className="kw-label">Danh mục sản phẩm</label>
            <select
              className="kw-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.badge})
                </option>
              ))}
            </select>
          </div>

          <div className="kw-field">
            <label className="kw-label">Quận / Huyện tại Đà Nẵng</label>
            <select
              className="kw-select"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
            >
              <option value="all">Toàn TP. Đà Nẵng</option>
              {DANANG_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="kw-search-filter-pair">
          <div className="kw-field">
            <label className="kw-label">Độ mới cam kết</label>
            <select
              className="kw-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="all">Tất cả độ mới</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="kw-field">
            <label className="kw-label">Khoảng giá Xu (1 Xu = 10.000đ)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="number"
                min={0}
                className="kw-input"
                placeholder="Từ (Xu)"
                value={minXu}
                onChange={(e) => setMinXu(e.target.value)}
              />
              <input
                type="number"
                min={0}
                className="kw-input"
                placeholder="Đến (Xu)"
                value={maxXu}
                onChange={(e) => setMaxXu(e.target.value)}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Area: Interactive Map + Results Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="kw-card" style={{ padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--color-primary)" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>
                Bản đồ món đồ quanh mẹ ({filtered.length} điểm)
              </span>
            </div>
            <span className="kw-badge kw-badge-teal">
              Bấm chấm đỏ để xem đồ
            </span>
          </div>
          <AddressMapPreview
            districtId={districtId === 'all' ? 'dn_haichau' : districtId}
            height={260}
            products={filtered}
            onSelectProduct={(id) => navigate(`/products/${id}`)}
          />
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
            Kết quả tìm kiếm ({filtered.length} món đồ)
          </h3>
          {filtered.length === 0 ? (
            <div className="kw-card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Không tìm thấy món đồ nào khớp với bộ lọc hiện tại.
              </p>
              <button type="button" onClick={handleReset} className="kw-btn kw-btn-primary">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="kw-grid-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} currentUserId={currentUser?.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
