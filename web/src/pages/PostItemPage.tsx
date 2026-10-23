// d:\Kindr\web\src\pages\PostItemPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Camera,
  Sparkles,
  ShieldCheck,
  MapPin,
  HeartHandshake,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { productApi, uploadApi } from '../services/domainServices';
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  getPriceBounds,
  calculateSafeFee,
  getConditionLabel,
  getSmartPricingNudge,
  formatXuToVND,
} from '../utils/pricing';
import { DANANG_DISTRICTS, getDistrictById, getWardsByDistrictId } from '../utils/locations';
import { CategoryType, ConditionType } from '../types';
import { KindrCoin, MascotIcon } from '../components/KindrCoin';
import { AddressMapPreview } from '../components/AddressMapPreview';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
];

const AGE_RANGES = ['0-12 tháng', '1-3 tuổi', '3-5 tuổi', 'Trên 5 tuổi', 'Mọi độ tuổi'];

export const PostItemPage: React.FC = () => {
  const { id: editId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, refreshProducts, refreshUser, showToast } = useApp();

  const isCharityInit = searchParams.get('charity') === '1';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>(
    isCharityInit ? 'charity' : 'toy_large'
  );
  const [condition, setCondition] = useState<ConditionType>('90');
  const [ageRange, setAgeRange] = useState<string>('1-3 tuổi');
  const [price, setPrice] = useState<number>(isCharityInit ? 0 : 10);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([SAMPLE_IMAGES[0]]);

  const [districtId, setDistrictId] = useState<string>(
    currentUser?.location?.districtId || 'dn_haichau'
  );
  const [wardId, setWardId] = useState<string>('hc_thachthang');
  const [addressDetail, setAddressDetail] = useState<string>(
    currentUser?.location?.addressDetail || ''
  );
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 16.0678,
    longitude: 108.2208,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId));
  const [errorMsg, setErrorMsg] = useState('');

  // Load existing product when editing
  useEffect(() => {
    if (!editId) return;
    let active = true;
    async function load() {
      setLoadingExisting(true);
      try {
        const prod = await productApi.getProductById(editId!);
        if (!active) return;
        setName(prod.name);
        setCategory((prod.category as CategoryType) || 'toy_large');
        setCondition((prod.condition as ConditionType) || '90');
        setAgeRange(prod.ageRange || '1-3 tuổi');
        setPrice(prod.price);
        setDescription(prod.description || '');
        const allImgs = [prod.image, ...(prod.additionalImages || [])].filter(Boolean);
        if (allImgs.length > 0) setImages(allImgs);
        if (prod.districtId) setDistrictId(prod.districtId);
        if (prod.wardId) setWardId(prod.wardId);
        if (prod.coordinates) setCoords(prod.coordinates);
      } catch {
        setErrorMsg('Không tìm thấy sản phẩm cần chỉnh sửa.');
      } finally {
        if (active) setLoadingExisting(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [editId]);

  // Update price bounds when category or condition changes (only if not loading existing)
  useEffect(() => {
    if (loadingExisting) return;
    const bounds = getPriceBounds(category, condition);
    if (category === 'charity' || category === 'tu_thien') {
      setPrice(0);
    } else if (price <= 0 || price > bounds.max) {
      setPrice(bounds.suggested);
    }
  }, [category, condition, loadingExisting]);

  // Update ward options when district changes
  useEffect(() => {
    const wards = getWardsByDistrictId(districtId);
    if (wards.length > 0 && !wards.some((w) => w.id === wardId)) {
      setWardId(wards[0].id);
    }
    const d = getDistrictById(districtId);
    setCoords({ latitude: d.lat, longitude: d.lng });
  }, [districtId]);

  const bounds = getPriceBounds(category, condition);
  const safeFee = calculateSafeFee(price, category);
  const isCharity = category === 'charity' || category === 'tu_thien' || price === 0;

  const handleAiSuggest = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Vui lòng nhập tên món đồ (ví dụ: Xe đẩy Combi, Sách Ehon...) trước khi gọi AI Gợi ý.');
      return;
    }
    setErrorMsg('');
    setAiLoading(true);
    try {
      const suggestion = await productApi.aiSuggest({
        itemName: name.trim(),
        selectedCategory: category,
        selectedCondition: condition,
      });
      const nextCat = (suggestion.category || category) as CategoryType;
      const nextCond = (suggestion.condition || condition) as ConditionType;
      const nextBounds = getPriceBounds(nextCat, nextCond);
      if (suggestion.category) setCategory(nextCat);
      if (suggestion.condition) setCondition(nextCond);
      if (suggestion.ageRange) {
        const ageMap: Record<string, string> = {
          '0-6m': '0-12 tháng',
          '6-12m': '0-12 tháng',
          '1-3y': '1-3 tuổi',
          '3+': '3-5 tuổi',
        };
        setAgeRange(ageMap[suggestion.ageRange] || suggestion.ageRange);
      }
      const clampedXu =
        typeof suggestion.suggestedXu === 'number'
          ? Math.min(nextBounds.max, Math.max(nextBounds.min, suggestion.suggestedXu))
          : nextBounds.suggested;
      setPrice(clampedXu);
      if (suggestion.description) setDescription(suggestion.description);
      showToast({
        title: 'AI Kindr đã phân tích xong!',
        message: `Đề xuất mức giá ${clampedXu} Xu & mô tả chi tiết cho "${name.trim()}".`,
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Đã áp dụng gợi ý thông minh',
        message: 'Đã tự động điền khung giá chuẩn Kindr.',
        type: 'info',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImg(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 4 - images.length); i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const uploadedUrl = await uploadApi.uploadBase64Image(base64, 'kindr/products');
        newUrls.push(uploadedUrl);
      }
      setImages((prev) => [...prev, ...newUrls].slice(0, 4));
    } catch {
      setErrorMsg('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!name.trim() || name.trim().length < 5) {
      setErrorMsg('Tên món đồ phải có ít nhất 5 ký tự.');
      return;
    }

    if (images.length === 0) {
      setErrorMsg('Vui lòng chọn hoặc tải lên ít nhất 1 hình ảnh thực tế của món đồ.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Vui lòng mô tả tình trạng món đồ tối thiểu 10 ký tự để người nhận yên tâm.');
      return;
    }

    if (!editId && !isCharity && currentUser.xuBalance < safeFee) {
      setErrorMsg(
        `Bạn cần tối thiểu ${safeFee} Xu trong ví để đặt cọc trách nhiệm Safe Fee (10%). Số dư hiện tại: ${currentUser.xuBalance} Xu.`
      );
      return;
    }

    const districtObj = getDistrictById(districtId);
    const wardObj = getWardsByDistrictId(districtId).find((w) => w.id === wardId);
    const locationName = [
      addressDetail.trim(),
      wardObj?.name,
      districtObj.name,
      'Đà Nẵng',
    ]
      .filter(Boolean)
      .join(', ');

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: isCharity ? 0 : price,
        condition,
        conditionLabel: getConditionLabel(condition),
        category: isCharity ? 'charity' : category,
        ageRange,
        locationName,
        districtId,
        wardId,
        coordinates: coords,
        image: images[0],
        additionalImages: images.slice(1),
        description: description.trim(),
      };

      if (editId) {
        await productApi.updateProduct(editId, payload);
        await refreshProducts();
        showToast({
          title: 'Cập nhật thành công!',
          message: `Bài đăng "${name.trim()}" đã được lưu thay đổi.`,
          type: 'success',
        });
        navigate(`/products/${editId}`);
      } else {
        const res = await productApi.createProduct(payload);
        await Promise.all([refreshProducts(), refreshUser()]);
        showToast({
          title: 'Đăng đồ thành công!',
          message: res.message,
          type: 'success',
        });
        navigate(`/products/${res.product.id}`);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error || 'Không thể lưu bài đăng. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={64}
            dialogue="Mẹ ơi, hãy đăng nhập để bắt đầu dọn nhà cho bé và nhận Xu tích lũy nhé!"
          />
          <h2 style={{ marginTop: 20, fontSize: 22, fontWeight: 800 }}>
            Đăng nhập để đăng đồ hoặc tặng đồ 0 Xu
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 24 }}>
            Tài khoản mới được tặng ngay 10 Xu Chào Mừng và tham gia cộng đồng Mẹ Bỉm Văn Minh Đà Nẵng.
          </p>
          <button className="kw-btn kw-btn-primary" onClick={() => navigate('/login')}>
            Đăng nhập / Đăng ký ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kw-container" style={{ padding: '28px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          className="kw-btn kw-btn-ghost kw-btn-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
            {editId
              ? 'Chỉnh sửa bài đăng'
              : isCharity
              ? 'Tặng đồ 0 Xu - Trạm Tặng Đồ'
              : 'Đăng đồ trao đổi chuẩn Kindr'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            Định giá cố định theo ma trận tình trạng — Không mặc cả, bảo vệ 2 chiều bằng Double Escrow
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderRadius: 'var(--radius-default)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="kw-split-detail">
        {/* LEFT COLUMN: FORM INPUTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. HÌNH ẢNH MÓN ĐỒ */}
          <div className="kw-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  1. Hình ảnh thực tế ({images.length}/4)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Tải ảnh từ máy tính/điện thoại hoặc chọn nhanh ảnh mẫu minh họa
                </p>
              </div>
              <label
                className="kw-btn kw-btn-outline kw-btn-sm"
                style={{ cursor: images.length >= 4 || uploadingImg ? 'not-allowed' : 'pointer' }}
              >
                <Upload size={15} />
                <span>{uploadingImg ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={images.length >= 4 || uploadingImg}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 12,
                marginBottom: 14,
              }}
            >
              {images.map((url, idx) => (
                <div
                  key={`${url}_${idx}`}
                  style={{
                    position: 'relative',
                    height: 120,
                    borderRadius: 'var(--radius-default)',
                    overflow: 'hidden',
                    border: idx === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Ảnh ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {idx === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-white)',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      Ảnh bìa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'var(--color-overlay)',
                      color: 'var(--color-text-white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Xóa ảnh"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {images.length < 4 && (
                <label
                  style={{
                    height: 120,
                    borderRadius: 'var(--radius-default)',
                    border: '1.5px dashed var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-subtle)',
                  }}
                >
                  <Camera size={22} color="var(--color-primary)" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                Ảnh mẫu thử nhanh:
              </span>
              {SAMPLE_IMAGES.map((sampleUrl, idx) => (
                <button
                  key={sampleUrl}
                  type="button"
                  className="kw-btn kw-btn-ghost kw-btn-sm"
                  style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
                  onClick={() => {
                    if (!images.includes(sampleUrl) && images.length < 4) {
                      setImages((prev) => [...prev, sampleUrl]);
                    }
                  }}
                >
                  + Mẫu #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* 2. THÔNG TIN & AI SUGGEST */}
          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>
              2. Thông tin món đồ & Gợi ý AI
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Tên món đồ của bé *
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="kw-input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="VD: Xe đẩy gấp gọn Combi, Bộ sách Ehon Nhật Bản, Lego Duplo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button
                  type="button"
                  className="kw-btn kw-btn-secondary"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                >
                  <Sparkles size={16} />
                  <span>{aiLoading ? 'AI đang phân tích...' : 'AI Tự điền & Định giá'}</span>
                </button>
              </div>
            </div>

            <div className="kw-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Danh mục sản phẩm *
                </label>
                <select
                  className="kw-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.badge})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Độ tuổi phù hợp
                </label>
                <select
                  className="kw-select"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                >
                  {AGE_RANGES.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Tình trạng thực tế (Cam kết trung thực) *
              </label>
              <div className="kw-grid-3">
                {CONDITION_OPTIONS.map((opt) => {
                  const active = condition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCondition(opt.value)}
                      style={{
                        textAlign: 'left',
                        padding: 14,
                        borderRadius: 'var(--radius-default)',
                        border: active
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        backgroundColor: active
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: active ? 'var(--color-primary-dark)' : 'var(--color-text)',
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          marginTop: 4,
                        }}
                      >
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Mô tả chi tiết tình trạng & câu chuyện món đồ *
              </label>
              <textarea
                className="kw-textarea"
                rows={4}
                placeholder="Chia sẻ rõ nguồn gốc, số lần bé dùng, các vết xước nhẹ (nếu có) để mẹ nhận đồ hoàn toàn yên tâm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 3. ĐỊA ĐIỂM GIAO NHẬN & BẢN ĐỒ */}
          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>
              3. Khu vực giao nhận tại Đà Nẵng
            </h3>

            <div className="kw-grid-2" style={{ marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Quận / Huyện
                </label>
                <select
                  className="kw-select"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                >
                  {DANANG_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Phường / Khu đô thị
                </label>
                <select
                  className="kw-select"
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                >
                  {getWardsByDistrictId(districtId).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Địa chỉ cụ thể (Chỉ hiển thị khu vực chung, bảo mật số nhà)
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={16}
                  color="var(--color-text-secondary)"
                  style={{ position: 'absolute', left: 14, top: 15 }}
                />
                <input
                  type="text"
                  className="kw-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="VD: Sảnh tòa FPT Plaza 2, đường Võ Chí Công..."
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                />
              </div>
            </div>

            <AddressMapPreview
              districtId={districtId}
              addressDetail={addressDetail}
              height={240}
              onLocationChange={(loc) => {
                setCoords({ latitude: loc.lat, longitude: loc.lng });
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING MATRIX & DOUBLE ESCROW SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="kw-card kw-sticky-panel" style={{ padding: 24, position: 'sticky', top: 88 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="kw-badge kw-badge-primary">Ma Trận Giá Cố Định</span>
              <button
                type="button"
                className="kw-btn kw-btn-ghost kw-btn-sm"
                style={{ minHeight: 34, padding: '0 10px', fontSize: 12 }}
                onClick={() => {
                  if (isCharity) {
                    setCategory('toy_large');
                    setPrice(10);
                  } else {
                    setCategory('charity');
                    setPrice(0);
                  }
                }}
              >
                <HeartHandshake size={14} />
                {isCharity ? 'Chuyển sang Đổi lấy Xu' : 'Chuyển sang Tặng 0 Xu'}
              </button>
            </div>

            {isCharity ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-default)',
                  backgroundColor: 'var(--color-secondary-light)',
                  border: '1px solid var(--color-secondary)',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, color: 'var(--color-secondary-dark)' }}>
                  <HeartHandshake size={22} />
                  <span>Tặng miễn phí 0 Xu</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
                  Món đồ sẽ xuất hiện tại Trạm Tặng Đồ. Người tặng được miễn 100% cọc Safe Fee và nhận điểm Văn Minh khi trao tay thành công!
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Mức Xu niêm yết (Tối đa {bounds.max} Xu)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KindrCoin size={22} />
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {price} Xu
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      (~{formatXuToVND(price)})
                    </span>
                  </div>
                </div>

                {bounds.max > bounds.min && (
                  <input
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                )}

                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {getSmartPricingNudge(category, condition)}
                </div>
              </div>
            )}

            {/* DOUBLE ESCROW BREAKDOWN */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                <ShieldCheck size={18} color="var(--color-secondary-dark)" />
                <span>Cơ chế bảo vệ Ký quỹ 2 chiều</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Xu mẹ nhận về khi hoàn tất:</span>
                <strong style={{ color: 'var(--color-success)' }}>+{price} Xu</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Cọc trách nhiệm Safe Fee (10%):</span>
                <strong style={{ color: 'var(--color-coin-text)' }}>
                  {safeFee === 0 ? 'Miễn cọc (0 Xu)' : `${safeFee} Xu (Hoàn lại 100%)`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Số dư khả dụng của mẹ:</span>
                <strong>{currentUser.xuBalance} Xu</strong>
              </div>
            </div>

            <button
              type="submit"
              className="kw-btn kw-btn-primary"
              style={{ width: '100%', fontSize: 15 }}
              disabled={submitting || loadingExisting}
            >
              <CheckCircle2 size={18} />
              <span>
                {submitting
                  ? 'Đang xử lý...'
                  : editId
                  ? 'Lưu thay đổi bài đăng'
                  : isCharity
                  ? 'Đăng tặng 0 Xu ngay'
                  : `Đăng đồ & Tạm khóa ${safeFee} Xu Safe Fee`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
