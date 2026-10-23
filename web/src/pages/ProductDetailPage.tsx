// d:\Kindr\web\src\pages\ProductDetailPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Clock,
  MessageCircle,
  Lock,
  Award,
  Star,
  Phone,
  Edit3,
  Trash2,
  Flag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  productApi,
  transactionApi,
  chatApi,
  reportApi,
  adminApi,
  ratingApi,
} from '../services/domainServices';
import { Product, RatingItem } from '../types';
import { KindrCoin, Avatar, MascotIcon } from '../components/KindrCoin';
import { ProductCard } from '../components/ProductCard';
import { AddressMapPreview } from '../components/AddressMapPreview';
import {
  formatXuToVND,
  getCategoryLabel,
  getConditionLabel,
  maskPhoneNumber,
  formatFullDate,
} from '../utils/pricing';
import { validateSwapXuRequirement } from '../utils/walletRules';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    products,
    refreshProducts,
    refreshUser,
    refreshTransactions,
    refreshChats,
    showToast,
  } = useApp();

  const [product, setProduct] = useState<Product | null>(
    () => products.find((p) => p.id === id) || null
  );
  const [loading, setLoading] = useState(!product);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sellerRatings, setSellerRatings] = useState<RatingItem[]>([]);
  const [sellerAverageRating, setSellerAverageRating] = useState<number>(5.0);

  const isValidObjectId = (val?: string) => Boolean(val && /^[a-f\d]{24}$/i.test(val));

  useEffect(() => {
    if (!id) return;
    let active = true;
    const localFound = products.find((p) => p.id === id) || null;
    if (localFound) {
      setProduct(localFound);
      setSelectedImage(localFound.image);
      setLoading(false);
    }
    if (!isValidObjectId(id)) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    productApi
      .getProductById(id)
      .then((p) => {
        if (active) {
          setProduct(p);
          setSelectedImage(p.image);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, products]);

  useEffect(() => {
    if (!product?.sellerId || !isValidObjectId(product.sellerId)) return;
    let active = true;
    ratingApi
      .getUserRatings(product.sellerId)
      .then((res) => {
        if (active) {
          setSellerRatings(res.ratings || []);
          setSellerAverageRating(res.averageStars || 5.0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product?.sellerId]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.status === 'available')
      .sort((a, b) => {
        const sameCatA = a.category === product.category ? 1 : 0;
        const sameCatB = b.category === product.category ? 1 : 0;
        return sameCatB - sameCatA;
      })
      .slice(0, 4);
  }, [products, product]);

  if (loading) {
    return (
      <div className="kw-card" style={{ textAlign: 'center', padding: 60 }}>
        Đang tải thông tin chi tiết món đồ...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="kw-card" style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
          Không tìm thấy món đồ này
        </h2>
        <Link to="/" className="kw-btn kw-btn-primary">
          Quay về trang khám phá
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(currentUser && product.sellerId === currentUser.id);
  const isAdmin = currentUser?.role === 'admin';
  const isCharity =
    product.price === 0 || product.category === 'charity' || product.category === 'tu_thien';
  const allImages = [product.image, ...(product.additionalImages || [])].filter(Boolean);
  const activeImg = selectedImage || product.image;

  const userHasPosted = products.some((p) => p.sellerId === currentUser?.id);
  const swapCheck = validateSwapXuRequirement(currentUser, product.price, userHasPosted);

  const resolveTargetProduct = async (): Promise<Product> => {
    if (isValidObjectId(product.id)) return product;
    const liveList = await productApi.getProducts();
    const matched =
      liveList.find((p) => p.name.toLowerCase() === product.name.toLowerCase()) ||
      liveList.find(
        (p) =>
          p.category === product.category &&
          p.status === 'available' &&
          p.sellerId !== currentUser?.id
      ) ||
      liveList.find((p) => p.status === 'available' && p.sellerId !== currentUser?.id);
    if (matched && isValidObjectId(matched.id)) {
      setProduct(matched);
      return matched;
    }
    throw new Error('Món đồ mẫu đang đồng bộ với máy chủ. Vui lòng chọn món đồ khác hoặc tải lại trang.');
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const target = await resolveTargetProduct();
      const chat = await chatApi.createChat(target.id, target.sellerId);
      await refreshChats();
      navigate(`/chat/${chat.id}`);
    } catch (err: any) {
      showToast({
        title: 'Không thể mở hội thoại',
        message: err.response?.data?.error || err.message || 'Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEscrow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const target = await resolveTargetProduct();
      const tx = await transactionApi.createTransaction(target.id);
      await Promise.all([refreshUser(), refreshProducts(), refreshTransactions()]);
      setEscrowModalOpen(false);
      showToast({
        title: 'Đã kích hoạt Ký Quỹ Bảo Chứng Kép!',
        message: `Mã PIN bàn giao 6 ký tự đã sẵn sàng trong chi tiết đơn hàng.`,
        type: 'success',
      });
      navigate(`/transactions/${tx.id}`);
    } catch (err: any) {
      showToast({
        title: 'Không thể tạo giao dịch',
        message: err.response?.data?.error || err.message || 'Vui lòng kiểm tra lại số dư Xu.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwnProduct = async () => {
    if (
      !window.confirm(
        'Mẹ có chắc muốn xóa bài đăng này? Hệ thống sẽ hoàn lại 100% cọc Safe Fee vào ví Xu của mẹ.'
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await productApi.deleteProduct(product.id);
      await Promise.all([refreshProducts(), refreshUser()]);
      showToast({
        title: 'Đã xóa bài đăng',
        message: res.message,
        type: 'success',
      });
      navigate('/');
    } catch (err: any) {
      showToast({
        title: 'Không thể xóa bài đăng',
        message: err.response?.data?.error || 'Sản phẩm đang trong giao dịch.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminRemove = async () => {
    if (!window.confirm('Xác nhận gỡ bài đăng vi phạm này và hoàn trả Safe Fee cho người bán?')) {
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.removeProduct(product.id);
      await refreshProducts();
      showToast({
        title: 'Admin: Đã gỡ bài đăng',
        message: 'Bài đăng đã chuyển sang trạng thái removed.',
        type: 'info',
      });
      navigate('/admin');
    } catch (err: any) {
      showToast({
        title: 'Lỗi gỡ bài',
        message: err.response?.data?.error || 'Không thể gỡ bài.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportReason.trim().length < 5) {
      showToast({
        title: 'Lý do quá ngắn',
        message: 'Vui lòng mô tả lý do báo cáo từ 5 ký tự trở lên.',
        type: 'warning',
      });
      return;
    }
    setSubmitting(true);
    try {
      const target = await resolveTargetProduct();
      await reportApi.submitReport({
        targetType: 'product',
        targetId: target.id,
        reason: reportReason.trim(),
      });
      setReportModalOpen(false);
      setReportReason('');
      showToast({
        title: 'Đã gửi báo cáo tới Ban Quản Trị',
        message: 'Cảm ơn mẹ đã chung tay giữ gìn cộng đồng Kindr văn minh.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Lỗi gửi báo cáo',
        message: err.response?.data?.error || err.message || 'Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="kw-btn kw-btn-outline kw-btn-sm"
        >
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentUser && !isOwner && (
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="kw-btn kw-btn-ghost kw-btn-sm"
            >
              <Flag size={15} color="var(--color-error)" />
              <span>Báo cáo bài đăng</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={handleAdminRemove}
              className="kw-btn kw-btn-danger kw-btn-sm"
            >
              <Trash2 size={15} />
              <span>Admin: Gỡ bài vi phạm</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Showcase */}
      <div
        className="kw-product-detail-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Left: Image Gallery + Double Escrow Guarantee + Map Preview */}
        <div className="kw-pd-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div
            className="kw-card kw-pd-gallery"
            style={{ padding: 'var(--space-4)', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: 'var(--radius-default)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface-subtle)',
                marginBottom: allImages.length > 1 ? 12 : 0,
              }}
            >
              <img
                src={activeImg}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/kindr-mascot-full.png';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border:
                        activeImg === imgUrl
                          ? '3px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Double Escrow Explanation Card */}
          <div
            className="kw-card kw-pd-escrow"
            style={{
              backgroundColor: 'var(--color-secondary-light)',
              borderColor: 'var(--color-secondary)',
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--color-secondary-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <ShieldCheck size={20} />
              <span>Cơ Chế Bảo Chứng Kép (Double Escrow)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--color-secondary-dark)" />
                <span>
                  Người bán đã khóa cọc <strong>{product.safeFeeLocked} Xu Safe Fee (10%)</strong> cam kết đúng mô tả & vệ sinh sạch sẽ.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="var(--color-secondary-dark)" />
                <span>
                  Khi bấm Đổi đồ, hệ thống cấp cho Mẹ Mua <strong>Mã PIN 6 ký tự bí mật</strong>. Chỉ đọc mã PIN cho Mẹ Bán khi gặp mặt nhận đồ.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--color-secondary-dark)" />
                <span>
                  Sau khi nhận đồ, mẹ có <strong>6 Giờ Kiểm Định Tại Nhà (Safeful Time)</strong> trước khi Xu được giải ngân cho người bán.
                </span>
              </div>
            </div>
          </div>

          {/* Pickup Location Map in Đà Nẵng */}
          <div className="kw-card kw-pd-map" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={17} color="var(--color-primary)" />
              <span>Bản đồ khu vực hẹn gặp ({product.locationName || 'Đà Nẵng'})</span>
            </div>
            <AddressMapPreview
              addressDetail={product.locationName || 'Đà Nẵng'}
              lat={product.coordinates?.latitude}
              lng={product.coordinates?.longitude}
              height={210}
            />
          </div>
        </div>

        {/* Right: Product Info, Seller Card, Reviews & Action Triggers */}
        <div className="kw-pd-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="kw-card kw-pd-info" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span className="kw-badge kw-badge-teal">
                  {getCategoryLabel(product.category)}
                </span>
                <span className="kw-badge kw-badge-coral">
                  {product.conditionLabel || getConditionLabel(product.condition)}
                </span>
                {product.ageRange && (
                  <span className="kw-badge kw-badge-muted">Độ tuổi: {product.ageRange}</span>
                )}
                <span className="kw-badge kw-badge-muted">
                  Đăng lúc: {formatFullDate(product.createdAt)}
                </span>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 14 }}>
                {product.name}
              </h1>

              {/* Price Banner */}
              <div
                style={{
                  backgroundColor: 'var(--color-coin-bg)',
                  border: '1px solid rgba(255, 159, 28, 0.3)',
                  borderRadius: 'var(--radius-default)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <KindrCoin size={28} />
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {isCharity ? '0 Xu (Tặng Từ Thiện)' : `${product.price} Xu`}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-coin-text)', fontWeight: 600 }}>
                      {isCharity
                        ? 'Miễn 100% phí bảo chứng Safe Fee'
                        : `Giá trị quy đổi ~ ${formatXuToVND(product.price)}`}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="kw-badge kw-badge-success">
                    Đã khóa cọc {product.safeFeeLocked} Xu Safe Fee
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-default)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <MapPin size={18} color="var(--color-primary)" />
              <span>Khu vực giao nhận: {product.locationName || 'Đà Nẵng'}</span>
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
                Mô tả chi tiết từ Mẹ Bán
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--color-text)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {product.description}
              </p>
            </div>

            {/* Seller Trust Card */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-default)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar uri={product.sellerAvatar} name={product.sellerName} size={48} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{product.sellerName}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} color="var(--color-warning)" fill="var(--color-warning)" />
                      {sellerAverageRating.toFixed(1)} Uy tín ({sellerRatings.length || 1} đánh giá)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Award size={13} color="var(--color-primary)" />
                      Mẹ Bỉm Văn Minh
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-card)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                }}
                title="Số điện thoại được tự động mở khóa khi bắt đầu giao dịch Ký Quỹ"
              >
                <Phone size={14} color="var(--color-secondary-dark)" />
                <span>
                  {isOwner || isAdmin
                    ? product.sellerPhone || '0905123456'
                    : maskPhoneNumber(product.sellerPhone)}
                </span>
              </div>
            </div>

            {/* Primary Actions */}
            {product.status !== 'available' ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-default)',
                  backgroundColor: 'var(--color-warning-bg)',
                  color: 'var(--color-coin-text)',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Món đồ này hiện đang trong giao dịch Ký Quỹ hoặc đã được đổi xong ({product.status}).
              </div>
            ) : isOwner ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <Link
                  to={`/edit-post/${product.id}`}
                  className="kw-btn kw-btn-outline kw-btn-lg"
                  style={{ flex: 1 }}
                >
                  <Edit3 size={18} />
                  <span>Chỉnh sửa bài đăng</span>
                </Link>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteOwnProduct}
                  className="kw-btn kw-btn-danger kw-btn-lg"
                  style={{ flex: 1 }}
                >
                  <Trash2 size={18} />
                  <span>Xóa bài & Hoàn cọc</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleStartChat}
                  className="kw-btn kw-btn-outline kw-btn-lg"
                  style={{ flex: '1 1 180px' }}
                >
                  <MessageCircle size={18} />
                  <span>Nhắn tin hỏi Mẹ Bán</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login');
                      return;
                    }
                    setEscrowModalOpen(true);
                  }}
                  className="kw-btn kw-btn-primary kw-btn-lg"
                  style={{ flex: '2 1 240px' }}
                >
                  <Lock size={18} />
                  <span>
                    {isCharity
                      ? 'Nhận Đồ Tặng 0 Xu Ngay'
                      : `Ký Quỹ Đổi Đồ Ngay (${product.price} Xu)`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Seller Community Ratings & Reviews Card */}
          <div className="kw-card kw-pd-reviews">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>
                Nhận xét từ các mẹ đã giao dịch với {product.sellerName}
              </h3>
              <span className="kw-badge kw-badge-warning">
                <Star size={12} fill="currentColor" /> {sellerAverageRating.toFixed(1)} / 5.0
              </span>
            </div>
            {sellerRatings.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Người bán đạt chuẩn Mẹ Bỉm Văn Minh Đà Nẵng, 100% bài đăng có cọc bảo chứng Safe Fee.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sellerRatings.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{r.fromUserName || 'Mẹ Bỉm Kindr'}</strong>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {formatFullDate(r.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, margin: '4px 0' }}>{r.comment}</p>
                    {r.tags && r.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {r.tags.map((tag: string, i: number) => (
                          <span key={i} className="kw-badge kw-badge-teal" style={{ fontSize: 11 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products Near You */}
      {similarProducts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
            Món đồ tương tự gần mẹ tại Đà Nẵng
          </h2>
          <div className="kw-grid-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} currentUserId={currentUser?.id} />
            ))}
          </div>
        </div>
      )}

      {/* Double Escrow Confirmation Modal */}
      {escrowModalOpen && currentUser && (
        <div className="kw-modal-backdrop" onClick={() => setEscrowModalOpen(false)}>
          <div className="kw-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>
              <MascotIcon
                size={48}
                dialogue="Gấu Kindy sẽ khóa tạm số Xu này vào rương bảo chứng. Tiền chỉ chuyển cho người bán sau khi mẹ nhận đồ và hết 6 giờ kiểm định tại nhà!"
              />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
              Xác nhận Ký Quỹ Đổi Đồ
            </h3>

            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Món đồ:</span>
                <strong>{product.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Số Xu tạm đóng băng của mẹ:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{product.price} Xu</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Số dư khả dụng hiện tại:</span>
                <strong>{currentUser.xuBalance} Xu</strong>
              </div>
              {currentUser.welcomeCreditRemaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-secondary-dark)' }}>
                  <span>Ưu tiên dùng Xu Chào Mừng:</span>
                  <strong>
                    {Math.min(currentUser.welcomeCreditRemaining, product.price)} Xu
                  </strong>
                </div>
              )}
            </div>

            {!swapCheck.allowed && (
              <div
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  padding: 12,
                  borderRadius: 'var(--radius-default)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={18} />
                <span>{swapCheck.reason}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setEscrowModalOpen(false)}
                className="kw-btn kw-btn-outline"
                style={{ flex: 1 }}
              >
                Hủy bỏ
              </button>
              {swapCheck.allowed ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmEscrow}
                  className="kw-btn kw-btn-primary"
                  style={{ flex: 2 }}
                >
                  <ShieldCheck size={17} />
                  <span>{submitting ? 'Đang khóa Ký Quỹ...' : 'Xác nhận Ký Quỹ & Lấy Mã PIN'}</span>
                </button>
              ) : (
                <Link to="/wallet" className="kw-btn kw-btn-primary" style={{ flex: 2 }}>
                  Nạp thêm Xu ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="kw-modal-backdrop" onClick={() => setReportModalOpen(false)}>
          <form
            className="kw-modal-box"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitReport}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
              Báo cáo bài đăng vi phạm
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Hãy cho Ban Quản Trị Kindr biết lý do bài đăng này không phù hợp:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                'Hình ảnh không đúng thực tế',
                'Món đồ có chi tiết sắc nhọn / mất an toàn cho bé',
                'Nghi ngờ bài đăng spam / buôn bán thương mại',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="kw-badge kw-badge-neutral"
                  style={{ cursor: 'pointer', border: '1px solid var(--color-border)' }}
                  onClick={() => setReportReason(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="kw-field">
              <textarea
                className="kw-textarea"
                placeholder="VD: Hình ảnh không đúng thực tế, đồ chơi có chi tiết sắc nhọn không an toàn..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="kw-btn kw-btn-outline"
                style={{ flex: 1 }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="kw-btn kw-btn-danger"
                style={{ flex: 1 }}
              >
                Gửi báo cáo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
