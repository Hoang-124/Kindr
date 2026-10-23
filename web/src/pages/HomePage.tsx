// d:\Kindr\web\src\pages\HomePage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Gift,
  ArrowRight,
  Lock,
  SlidersHorizontal,
  LayoutGrid,
  ToyBrick,
  Gamepad2,
  BookOpen,
  Shirt,
  Baby,
  GraduationCap,
  HelpCircle,
  MessageSquareHeart,
  Award,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { MascotIcon, KindrCoin } from '../components/KindrCoin';
import { surveyApi, waitlistApi } from '../services/domainServices';

const BENTO_CATEGORIES = [
  { id: 'all', label: 'Tất cả món đồ', desc: 'Toàn sàn Đà Nẵng', Icon: LayoutGrid },
  { id: 'toy_small', label: 'Đồ chơi nhỏ', desc: 'Cố định 2 Xu', Icon: ToyBrick },
  { id: 'toy_large', label: 'Đồ chơi lớn', desc: '5 – 10 Xu', Icon: Gamepad2 },
  { id: 'book', label: 'Sách truyện & Ehon', desc: '1 – 2 Xu', Icon: BookOpen },
  { id: 'quan_ao', label: 'Quần áo bé', desc: '2 – 5 Xu', Icon: Shirt },
  { id: 'xe_noi', label: 'Xe đẩy & Nôi cũi', desc: '15 – 30 Xu', Icon: Baby },
  { id: 'do_hoc_tap', label: 'Đồ học tập', desc: '2 – 4 Xu', Icon: GraduationCap },
  { id: 'charity', label: 'Trạm Tặng 0 Xu', desc: 'Miễn cọc Safe Fee', Icon: Gift },
];

export const HomePage: React.FC = () => {
  const {
    currentUser,
    products,
    productsLoading,
    transactions,
    refreshUser,
    showToast,
    setOnboardingOpen,
  } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [quickQuery, setQuickQuery] = useState('');

  // Popup Survey (+10 Xu) state
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyPhone, setSurveyPhone] = useState('');
  const [surveyHasItems, setSurveyHasItems] = useState(true);
  const [surveyMotivation, setSurveyMotivation] = useState<'save_money' | 'declutter' | 'new_items'>('declutter');
  const [surveyFearsScams, setSurveyFearsScams] = useState(true);
  const [surveyFindsUseful, setSurveyFindsUseful] = useState(true);
  const [surveyReferral, setSurveyReferral] = useState<'willing' | 'try_first'>('willing');
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  // Founding Member Waitlist (+5 Xu) state
  const [waitlistStats, setWaitlistStats] = useState({ totalRegistered: 32, remainingSlots: 168 });
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistRole, setWaitlistRole] = useState<'mom' | 'genz'>('mom');
  const [waitlistInterest, setWaitlistInterest] = useState<
    'Đồ chơi vận động' | 'Xe đẩy, nôi cũi' | 'Quần áo Nous/cotton' | 'Sách Ehon'
  >('Đồ chơi vận động');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistResultCode, setWaitlistResultCode] = useState('');

  useEffect(() => {
    waitlistApi
      .getStats()
      .then((s) => setWaitlistStats(s))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.phone) {
      setSurveyPhone(currentUser.phone);
    }
  }, [currentUser?.phone]);

  const activeEscrowTxs = useMemo(() => {
    if (!currentUser) return [];
    return transactions.filter(
      (tx) =>
        (tx.buyerId === currentUser.id || tx.sellerId === currentUser.id) &&
        (tx.status === 'awaiting_handover' ||
          tx.status === 'in_safeful_time' ||
          tx.status === 'disputed')
    );
  }, [transactions, currentUser]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.status === 'available')
      .filter((p) => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'toy_small') {
          return p.category === 'toy_small' || p.category === 'do_choi';
        }
        if (selectedCategory === 'book') {
          return p.category === 'book' || p.category === 'sach_truyen';
        }
        if (selectedCategory === 'charity') {
          return p.category === 'charity' || p.category === 'tu_thien' || p.price === 0;
        }
        return p.category === selectedCategory;
      })
      .filter((p) => {
        if (!quickQuery.trim()) return true;
        const q = quickQuery.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.locationName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'price_asc') return a.price - b.price;
        if (sortOrder === 'price_desc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, selectedCategory, sortOrder, quickQuery]);

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyPhone.trim()) return;
    setSurveySubmitting(true);
    try {
      const res = await surveyApi.submitSurvey({
        phone: surveyPhone.trim(),
        hasItemsToDeclutter: surveyHasItems,
        motivation: surveyMotivation,
        fearsFacebookScams: surveyFearsScams,
        findsAppUseful: surveyFindsUseful,
        referralIntent: surveyReferral,
      });
      await refreshUser();
      setSurveyModalOpen(false);
      showToast({
        title: res.credited
          ? `Đã tặng +${res.starterXu || 5} Xu Khảo Sát Tân Thủ!`
          : 'Đã ghi nhận khảo sát!',
        message: res.rewardCode
          ? `${res.message} (Mã ưu đãi: ${res.rewardCode})`
          : res.message,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Thông báo khảo sát',
        message: err.response?.data?.error || 'SĐT này đã nhận thưởng khảo sát trước đó.',
        type: 'warning',
      });
    } finally {
      setSurveySubmitting(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistPhone.trim() || !waitlistEmail.trim()) return;
    setWaitlistSubmitting(true);
    try {
      const res = await waitlistApi.register({
        parentName: waitlistName.trim(),
        phone: waitlistPhone.trim(),
        email: waitlistEmail.trim(),
        userRole: waitlistRole,
        interest: waitlistInterest,
      });
      await refreshUser();
      setWaitlistResultCode(res.memberCode || `KINDR-${res.slotNumber}`);
      setWaitlistStats((prev) => ({
        totalRegistered: prev.totalRegistered + 1,
        remainingSlots: Math.max(0, prev.remainingSlots - 1),
      }));
      showToast({
        title: 'Đăng ký Top 200 Tiên Phong thành công!',
        message: res.message,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Thông báo Waitlist',
        message: err.response?.data?.error || 'Email hoặc SĐT này đã có trong danh sách Tiên Phong.',
        type: 'warning',
      });
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Active Escrow Alert Bar with Product Thumbnail */}
      {activeEscrowTxs.length > 0 && (
        <div
          className="kw-card-compact"
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={activeEscrowTxs[0].productImage}
              alt={activeEscrowTxs[0].productName}
              referrerPolicy="no-referrer"
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-sm)',
                objectFit: 'cover',
                border: '2px solid var(--color-warning)',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14 }}>
                <Lock size={15} color="var(--color-warning)" />
                <span>
                  Mẹ đang có {activeEscrowTxs.length} giao dịch Bảo Chứng Kép đang diễn ra!
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Đơn gần nhất: <strong>{activeEscrowTxs[0].productName}</strong> — Bấm để xem mã PIN 6 ký tự bàn giao hoặc đồng hồ 6h kiểm định.
              </div>
            </div>
          </div>
          <Link
            to={`/transactions/${activeEscrowTxs[0].id}`}
            className="kw-btn kw-btn-primary kw-btn-sm"
          >
            <span>Mở đơn hàng ngay</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Hero Command Stage with Real Mobile Mascot Illustration */}
      <div
        className="kw-card"
        style={{
          background:
            'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-card) 58%, var(--color-secondary-light) 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <span className="kw-badge kw-badge-coral">
              <Sparkles size={13} /> Mạng Lưới Mẹ Bỉm Đà Nẵng
            </span>
            <span className="kw-badge kw-badge-teal">
              <ShieldCheck size={13} /> 100% Double Escrow
            </span>
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="kw-badge kw-badge-warning"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <HelpCircle size={13} /> Xem Cẩm Nang 3 Bước
            </button>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            Hôm nay dọn nhà cho bé đỡ chật nhé mẹ ơi!
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-muted)',
              marginBottom: 20,
              maxWidth: 580,
            }}
          >
            Biến đồ chơi, sách truyện, xe đẩy bé đã chán thành <strong>Kindr Xu</strong> trong 30 giây.
            Khung định giá chuẩn không mặc cả, bảo vệ cả hai mẹ bằng 6 giờ kiểm định tại nhà.
          </p>

          {/* Search & Quick CTA Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input
                type="text"
                className="kw-input"
                placeholder="Tìm xe đẩy, Lego, sách Ehon, ghế ăn dặm..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                style={{ backgroundColor: 'var(--color-card)', paddingLeft: 40 }}
              />
              <Search
                size={18}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 14, top: 15 }}
              />
            </div>
            <Link to="/post" className="kw-btn kw-btn-primary">
              <PlusCircle size={18} />
              <span>Đăng đồ nhận Xu</span>
            </Link>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="kw-btn kw-btn-outline"
            >
              <SlidersHorizontal size={16} />
              <span>Bản đồ & Bộ lọc</span>
            </button>
          </div>
        </div>

        {/* Right Hero Box with Real Mobile Mascot Full Artwork */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            backgroundColor: 'var(--color-card)',
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/assets/images/kindr-mascot-full.png"
              alt="Gấu Kindy Mascot"
              style={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-primary-light)',
                padding: 6,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                Trợ lý Gấu Kindy Bảo Chứng Kép
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                “Kindy giữ hộ Xu trong rương bảo chứng suốt <strong>6 giờ kiểm định tại nhà</strong>. Đồ đúng cam kết mới giải ngân Xu cho người bán!”
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              paddingTop: 12,
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                10.000đ
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                = 1 Kindr Xu
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-secondary-dark)' }}>
                10%
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Cọc Safe Fee
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-warning)' }}>
                6 Giờ
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Safeful Time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Category Filter Bar with Icons */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Danh mục đồ cho bé</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setSurveyModalOpen(true)}
              className="kw-btn kw-btn-outline kw-btn-sm"
            >
              <MessageSquareHeart size={15} color="var(--color-primary)" />
              <span>Khảo sát nhận +10 Xu</span>
            </button>
            <Link
              to="/donation-station"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Gift size={15} /> Mở Trạm Tặng Đồ 0 Xu <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: 10,
          }}
        >
          {BENTO_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const IconComp = cat.Icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-default)',
                  border: active
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  backgroundColor: active
                    ? 'var(--color-primary-light)'
                    : 'var(--color-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minHeight: 76,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                      color: active ? '#FFFFFF' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComp size={16} />
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: active ? 'var(--color-primary-dark)' : 'var(--color-text)',
                      marginBottom: 2,
                    }}
                  >
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Feed Header & Grid */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>
              Gần mẹ hôm nay ({filteredProducts.length} món đồ)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Tất cả bài đăng đã ký quỹ 10% Safe Fee cam kết đúng mô tả và vệ sinh sạch sẽ
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Sắp xếp:
            </span>
            <select
              className="kw-select"
              style={{ width: 190, minHeight: 44 }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="newest">Mới đăng gần nhất</option>
              <option value="price_asc">Giá Xu: Thấp đến Cao</option>
              <option value="price_desc">Giá Xu: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {productsLoading ? (
          <div className="kw-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Đang tải danh sách đồ cho bé...
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="kw-card" style={{ textAlign: 'center', padding: 48 }}>
            <MascotIcon
              size={56}
              dialogue="Chưa có món đồ nào khớp bộ lọc này. Mẹ thử chọn danh mục khác hoặc đăng món đồ đầu tiên nhé!"
            />
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setQuickQuery('');
                }}
                className="kw-btn kw-btn-outline"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <div className="kw-grid-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Founding Member Waitlist Top 200 (+5 Xu) & Survey (+10 Xu) Community Banner */}
      <div
        className="kw-card"
        style={{
          background:
            'linear-gradient(135deg, var(--color-secondary-light) 0%, var(--color-card) 65%, var(--color-primary-light) 100%)',
          borderColor: 'var(--color-secondary)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'center',
        }}
      >
        <div>
          <span className="kw-badge kw-badge-teal" style={{ marginBottom: 10 }}>
            <Award size={14} /> Đặc Quyền Top 200 Mẹ Bỉm Tiên Phong Đà Nẵng
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
            Nhận +5 Xu Tiên Phong & +5 Xu Khảo Sát Tân Thủ!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Đăng ký giữ chỗ Top 200 Founding Member để nhận tự động <strong>+5 Xu Tiên Phong</strong>, hoặc làm khảo sát nhanh 5 câu (30 giây) nhận ngay <strong>+5 Xu Tân Thủ & Miễn Safe Fee 3 bài đăng đầu</strong>!
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Đã đăng ký: <strong style={{ color: 'var(--color-primary)' }}>{waitlistStats.totalRegistered}/200</strong> suất • Còn lại: <strong style={{ color: 'var(--color-secondary-dark)' }}>{waitlistStats.remainingSlots} suất</strong>
            </div>

            <button
              type="button"
              onClick={() => setSurveyModalOpen(true)}
              className="kw-btn kw-btn-outline kw-btn-sm"
            >
              <KindrCoin size={16} />
              <span>Làm khảo sát 30s (+5 Xu & Miễn Safe Fee)</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleWaitlistSubmit}
          style={{
            backgroundColor: 'var(--color-card)',
            padding: 20,
            borderRadius: 'var(--radius-default)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            Giữ suất Founding Member (+5 Xu)
          </div>
          {waitlistResultCode ? (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircle2 size={20} />
              <div>
                <div>Đăng ký thành công! Mã Tiên Phong của mẹ: <strong>{waitlistResultCode}</strong></div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Hệ thống tự động cộng +5 Xu vào ví khi mẹ dùng SĐT/Email này trên Kindr.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="kw-grid-2" style={{ gap: 10 }}>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="Tên của mẹ (tuỳ chọn)"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                />
                <input
                  type="tel"
                  className="kw-input"
                  placeholder="Số điện thoại *"
                  value={waitlistPhone}
                  onChange={(e) => setWaitlistPhone(e.target.value)}
                  required
                />
              </div>
              <div className="kw-grid-2" style={{ gap: 10 }}>
                <input
                  type="email"
                  className="kw-input"
                  placeholder="Email nhận mã ưu đãi *"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                />
                <select
                  className="kw-select"
                  value={waitlistRole}
                  onChange={(e) => setWaitlistRole(e.target.value as 'mom' | 'genz')}
                >
                  <option value="mom">Mẹ bỉm sữa có con nhỏ</option>
                  <option value="genz">Gia đình trẻ / GenZ</option>
                </select>
              </div>
              <div>
                <select
                  className="kw-select"
                  value={waitlistInterest}
                  onChange={(e) => setWaitlistInterest(e.target.value as any)}
                >
                  <option value="Đồ chơi vận động">Quan tâm: Đồ chơi vận động</option>
                  <option value="Xe đẩy, nôi cũi">Quan tâm: Xe đẩy, nôi cũi</option>
                  <option value="Quần áo Nous/cotton">Quan tâm: Quần áo Nous/cotton</option>
                  <option value="Sách Ehon">Quan tâm: Sách Ehon</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={waitlistSubmitting}
                className="kw-btn kw-btn-primary"
              >
                <Sparkles size={16} />
                <span>{waitlistSubmitting ? 'Đang ghi danh...' : 'Đăng ký giữ suất Top 200 (+5 Xu)'}</span>
              </button>
            </>
          )}
        </form>
      </div>

      {/* Popup Survey (+5 Xu & Safe Fee Waiver) Modal */}
      {surveyModalOpen && (
        <div className="kw-modal-backdrop" onClick={() => setSurveyModalOpen(false)}>
          <form
            className="kw-modal-box"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSurveySubmit}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="kw-badge kw-badge-coral">
                <KindrCoin size={14} /> Quà tặng Khảo Sát +5 Xu & Miễn Safe Fee
              </span>
              <button
                type="button"
                onClick={() => setSurveyModalOpen(false)}
                className="kw-btn kw-btn-ghost kw-btn-sm"
                style={{ minHeight: 36, padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              Khảo sát Mẹ Bỉm Đà Nẵng (5 câu - 30 giây)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Góp ý giúp Kindr hoàn thiện hơn và nhận ngay <strong>+5 Xu Tân Thủ + Miễn 100% Phí Bảo Đảm (Safe Fee) cho 3 bài đăng đầu tiên</strong>!
            </p>

            <div className="kw-field">
              <label className="kw-label">Số điện thoại tài khoản nhận +5 Xu *</label>
              <input
                type="tel"
                className="kw-input"
                placeholder="VD: 0905123456"
                value={surveyPhone}
                onChange={(e) => setSurveyPhone(e.target.value)}
                required
              />
            </div>

            <div className="kw-grid-2" style={{ gap: 10 }}>
              <div className="kw-field">
                <label className="kw-label">1. Nhà mẹ có đồ của bé cần dọn bớt?</label>
                <select
                  className="kw-select"
                  value={surveyHasItems ? 'yes' : 'no'}
                  onChange={(e) => setSurveyHasItems(e.target.value === 'yes')}
                >
                  <option value="yes">Có nhiều đồ bé không dùng nữa</option>
                  <option value="no">Chưa có, chủ yếu tìm đồ cho bé</option>
                </select>
              </div>
              <div className="kw-field">
                <label className="kw-label">2. Mục tiêu chính khi đổi đồ?</label>
                <select
                  className="kw-select"
                  value={surveyMotivation}
                  onChange={(e) => setSurveyMotivation(e.target.value as any)}
                >
                  <option value="declutter">Dọn nhà gọn gàng, đỡ lãng phí</option>
                  <option value="save_money">Tiết kiệm chi phí nuôi con</option>
                  <option value="new_items">Đổi đồ chơi/sách mới cho bé</option>
                </select>
              </div>
            </div>

            <div className="kw-grid-2" style={{ gap: 10 }}>
              <div className="kw-field">
                <label className="kw-label">3. Mẹ có ngại mặc cả/bùng kèo trên FB?</label>
                <select
                  className="kw-select"
                  value={surveyFearsScams ? 'yes' : 'no'}
                  onChange={(e) => setSurveyFearsScams(e.target.value === 'yes')}
                >
                  <option value="yes">Có, rất mất thời gian & lo ngại</option>
                  <option value="no">Bình thường</option>
                </select>
              </div>
              <div className="kw-field">
                <label className="kw-label">4. Sàn giữ cọc kiểm định 6h có hữu ích?</label>
                <select
                  className="kw-select"
                  value={surveyFindsUseful ? 'yes' : 'no'}
                  onChange={(e) => setSurveyFindsUseful(e.target.value === 'yes')}
                >
                  <option value="yes">Rất hữu ích & yên tâm</option>
                  <option value="no">Cần trải nghiệm thêm</option>
                </select>
              </div>
            </div>

            <div className="kw-field">
              <label className="kw-label">5. Mẹ có sẵn lòng giới thiệu mẹ khác cùng khu?</label>
              <select
                className="kw-select"
                value={surveyReferral}
                onChange={(e) => setSurveyReferral(e.target.value as any)}
              >
                <option value="willing">Sẵn lòng rủ các mẹ cùng chung cư/khu phố</option>
                <option value="try_first">Để mình trải nghiệm thử trước</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSurveyModalOpen(false)}
                className="kw-btn kw-btn-outline"
                style={{ flex: 1 }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={surveySubmitting}
                className="kw-btn kw-btn-primary"
                style={{ flex: 2 }}
              >
                <KindrCoin size={18} />
                <span>{surveySubmitting ? 'Đang xử lý...' : 'Gửi khảo sát & Nhận +5 Xu'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
