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
  HelpCircle,
  MessageSquareHeart,
  Award,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { MascotIcon, KindrCoin } from '../components/KindrCoin';
import {
  PortalToyShelfSvg,
  PortalCameraCoinSvg,
  PortalGiftHeartSvg,
  PiggyBankSvg,
  CatAllSvg,
  CatSmallToySvg,
  CatLargeToySvg,
  CatBookEhonSvg,
  CatBabyClothesSvg,
  CatStrollerCribSvg,
  CatStudySvg,
  CatCharityGiftSvg,
  CribSvg,
} from '../components/NurserySvgIllustrations';
import { surveyApi, waitlistApi } from '../services/domainServices';

const BENTO_CATEGORIES = [
  {
    id: 'all',
    label: 'Tất cả đồ cho bé',
    desc: 'Xem toàn bộ tại Đà Nẵng',
    bgToken: 'var(--color-pastel-pink)',
    Icon: CatAllSvg,
  },
  {
    id: 'toy_small',
    label: 'Đồ chơi nhỏ',
    desc: '2 Xu (20.000đ)',
    bgToken: 'var(--color-pastel-butter)',
    Icon: CatSmallToySvg,
  },
  {
    id: 'toy_large',
    label: 'Đồ chơi lớn',
    desc: '5–10 Xu (50–100k)',
    bgToken: 'var(--color-pastel-peach)',
    Icon: CatLargeToySvg,
  },
  {
    id: 'book',
    label: 'Sách truyện & Ehon',
    desc: '1–2 Xu (10–20k)',
    bgToken: 'var(--color-pastel-sky)',
    Icon: CatBookEhonSvg,
  },
  {
    id: 'quan_ao',
    label: 'Quần áo bé',
    desc: '2–5 Xu (20–50k)',
    bgToken: 'var(--color-pastel-pink)',
    Icon: CatBabyClothesSvg,
  },
  {
    id: 'xe_noi',
    label: 'Xe đẩy & Nôi cũi',
    desc: '15–30 Xu (150–300k)',
    bgToken: 'var(--color-pastel-mint)',
    Icon: CatStrollerCribSvg,
  },
  {
    id: 'do_hoc_tap',
    label: 'Đồ học tập',
    desc: '2–4 Xu (20–40k)',
    bgToken: 'var(--color-pastel-lavender)',
    Icon: CatStudySvg,
  },
  {
    id: 'charity',
    label: 'Trạm Tặng 0đ',
    desc: 'Miễn phí 100%',
    bgToken: 'var(--color-pastel-mint)',
    Icon: CatCharityGiftSvg,
  },
];

const DECLUTTER_CALCULATOR_ITEMS = [
  { id: 'stroller', label: 'Xe đẩy / Ghế ăn dặm', xu: 20, SvgIcon: CatStrollerCribSvg },
  { id: 'clothes', label: '3 bộ quần áo bé chật', xu: 9, SvgIcon: CatBabyClothesSvg },
  { id: 'lego', label: 'Đồ chơi gỗ / Lego', xu: 6, SvgIcon: CatLargeToySvg },
  { id: 'books', label: 'Bộ sách truyện Ehon', xu: 2, SvgIcon: CatBookEhonSvg },
  { id: 'crib', label: 'Nôi cũi / Xe chòi chân', xu: 15, SvgIcon: CribSvg },
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
  const [selectedCalcIds, setSelectedCalcIds] = useState<string[]>(['stroller', 'clothes', 'lego']);

  const toggleCalcItem = (id: string) => {
    setSelectedCalcIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalCalcXu = DECLUTTER_CALCULATOR_ITEMS.filter((i) =>
    selectedCalcIds.includes(i.id)
  ).reduce((sum, i) => sum + i.xu, 0);

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

      {/* Hero Command Stage — Warm Nursery & Beginner-Friendly */}
      <div
        className="kw-card"
        style={{
          background:
            'linear-gradient(135deg, var(--color-pastel-pink) 0%, var(--color-card) 52%, var(--color-pastel-butter) 100%)',
          border: '1.5px solid var(--color-border-strong)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <span className="kw-badge kw-badge-coral">
              <Sparkles size={13} /> Hội Mẹ Bỉm Sữa Đà Nẵng
            </span>
            <span className="kw-badge kw-badge-teal">
              <ShieldCheck size={13} /> Giữ Hộ Xu An Toàn 100%
            </span>
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="kw-badge kw-badge-warning"
              style={{ cursor: 'pointer', border: '1px solid var(--color-warning)' }}
            >
              <HelpCircle size={13} /> Hướng dẫn cho mẹ mới dùng
            </button>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.22,
              letterSpacing: -0.4,
              marginBottom: 12,
            }}
          >
            Đổi đồ chơi, quần áo & xe đẩy cho bé thật dễ dàng!
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-muted)',
              marginBottom: 20,
              maxWidth: 580,
              lineHeight: 1.6,
            }}
          >
            Món đồ bé đã chật hay chơi chán đều đổi được sang <strong>Kindr Xu (1 Xu = 10.000đ)</strong> để lấy món đồ mới.
            Giá niêm yết sẵn <strong>không cần mặc cả</strong>, được mang về nhà <strong>kiểm tra 6 tiếng</strong> mới trừ Xu!
          </p>

          {/* Search & Quick CTA Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input
                type="text"
                className="kw-input"
                placeholder="Gõ tên món đồ: Xe đẩy, Lego, sách vải, quần áo..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                style={{ backgroundColor: 'var(--color-card)', paddingLeft: 42, fontSize: 15 }}
              />
              <Search
                size={18}
                color="var(--color-primary)"
                style={{ position: 'absolute', left: 14, top: 15 }}
              />
            </div>
            <Link to="/post" className="kw-btn kw-btn-primary" style={{ flex: '1 1 150px' }}>
              <PlusCircle size={18} />
              <span>Đăng đồ nhận Xu</span>
            </Link>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="kw-btn kw-btn-outline"
              style={{ flex: '1 1 140px' }}
            >
              <SlidersHorizontal size={16} />
              <span>Tìm theo Quận</span>
            </button>
          </div>
        </div>

        {/* Right Hero Box with Real Mobile Mascot Full Artwork */}
        <div
          className="kw-hero-mascot-box"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            backgroundColor: 'var(--color-card)',
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              className="kw-hero-mascot-img kw-float-anim"
              src="/assets/images/kindr-mascot-full.png"
              alt="Gấu Kindy Mascot"
              style={{
                width: 86,
                height: 86,
                objectFit: 'contain',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-pastel-butter)',
                padding: 6,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                Gấu Kindy bảo vệ các mẹ bỉm thế nào?
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
                “Khi mẹ bấm đổi đồ, Kindy <strong>giữ hộ Xu trong két an toàn</strong>. Mẹ nhận đồ tận tay và mang về nhà <strong>kiểm tra 6 tiếng</strong> thấy ưng ý thì người bán mới nhận được Xu!”
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
            <div
              style={{
                backgroundColor: 'var(--color-pastel-pink)',
                padding: '8px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                10.000đ
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                = 1 Kindr Xu
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-pastel-mint)',
                padding: '8px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-secondary-dark)' }}>
                Cọc 10%
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                Hoàn lại 100%
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-pastel-butter)',
                padding: '8px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-coin-text)' }}>
                6 Tiếng
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                Kiểm đồ tại nhà
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 GIANT TACTILE ACTION PORTALS — "Mẹ muốn làm gì hôm nay?" */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
              Mẹ muốn làm gì hôm nay? (Chỉ cần bấm 1 nút lớn bên dưới)
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Thiết kế chữ to, rõ ràng — Dễ dùng ngay cả khi mẹ đang bế bé bằng một tay
            </p>
          </div>
        </div>

        <div className="kw-grid-3" style={{ gap: 16 }}>
          {/* Portal 1: Tìm đồ cho bé */}
          <button
            type="button"
            className="kw-action-portal"
            style={{
              backgroundColor: 'var(--color-pastel-pink)',
              borderColor: 'var(--color-primary)',
            }}
            onClick={() => {
              document.getElementById('product-shelf')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-card)',
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <PortalToyShelfSvg size={38} />
                </span>
                <span className="kw-badge kw-badge-coral">Bước 1 • Chọn đồ</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: 'var(--color-text)', marginBottom: 6 }}>
                1. Xem & Đổi Đồ Cho Bé
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Quần áo sơ sinh, đồ chơi gỗ, xe đẩy mới 90% quanh Đà Nẵng chỉ từ <strong>10.000đ (1 Xu)</strong>.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: 14,
                color: 'var(--color-primary-dark)',
              }}
            >
              <span>Xem kệ đồ ngay</span>
              <ArrowRight size={16} />
            </div>
          </button>

          {/* Portal 2: Chụp ảnh đăng đồ cũ */}
          <button
            type="button"
            className="kw-action-portal"
            style={{
              backgroundColor: 'var(--color-pastel-butter)',
              borderColor: 'var(--color-warning)',
            }}
            onClick={() => navigate('/post')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-card)',
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <PortalCameraCoinSvg size={38} />
                </span>
                <span className="kw-badge kw-badge-gold">Chụp ảnh 30 giây</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: 'var(--color-text)', marginBottom: 6 }}>
                2. Đổi Đồ Cũ Lấy Xu
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Đồ bé mặc chật hay chơi chán đem đăng lên nhận ngay <strong>Kindr Xu</strong> để đổi món mới cho con.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: 14,
                color: 'var(--color-coin-text)',
              }}
            >
              <span>Bấm đăng đồ ngay</span>
              <ArrowRight size={16} />
            </div>
          </button>

          {/* Portal 3: Trạm tặng đồ 0 đồng */}
          <button
            type="button"
            className="kw-action-portal"
            style={{
              backgroundColor: 'var(--color-pastel-mint)',
              borderColor: 'var(--color-secondary)',
            }}
            onClick={() => navigate('/donation-station')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-card)',
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <PortalGiftHeartSvg size={38} />
                </span>
                <span className="kw-badge kw-badge-teal">Miễn phí 0 đồng</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: 'var(--color-text)', marginBottom: 6 }}>
                3. Trạm Tặng Đồ 0 Đồng
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Nhận hoặc gửi tặng đồ sơ sinh, sách truyện hoàn toàn <strong>miễn phí (0 Xu)</strong> tại 3 trạm Đà Nẵng.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: 14,
                color: 'var(--color-secondary-dark)',
              }}
            >
              <span>Vào Trạm Tặng Đồ 0đ</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      </div>

      {/* INTERACTIVE PIGGY BANK CALCULATOR — "Ống Heo Tính Xu Dọn Nhà Cho Mẹ" */}
      <div
        className="kw-card"
        style={{
          background:
            'linear-gradient(135deg, var(--color-pastel-butter) 0%, var(--color-card) 55%, var(--color-pastel-pink) 100%)',
          border: '2px solid var(--color-warning)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div>
          <span className="kw-badge kw-badge-gold" style={{ marginBottom: 8 }}>
            <PiggyBankSvg size={18} />
            <span>Ống Heo Tính Thử • Nhà mẹ đang có món nào bé không dùng nữa?</span>
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
            Bấm chọn thử các món đồ cũ trong nhà để xem mẹ đổi được bao nhiêu Xu nhé!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
            Chạm vào từng món bên dưới để cộng/trừ vào Ống Heo Tiết Kiệm của mẹ:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DECLUTTER_CALCULATOR_ITEMS.map((item) => {
              const active = selectedCalcIds.includes(item.id);
              const ItemSvg = item.SvgIcon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCalcItem(item.id)}
                  className={`kw-savings-chip ${active ? 'active' : ''}`}
                >
                  <ItemSvg size={20} />
                  <span>{item.label}</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 99,
                      backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                      color: active ? '#fff' : 'var(--color-coin-text)',
                      fontSize: 12,
                    }}
                  >
                    +{item.xu} Xu
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-border-strong)',
            padding: 20,
            textAlign: 'center',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Tổng giá trị ống heo mẹ nhận về:
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 32,
              fontWeight: 900,
              color: 'var(--color-primary-dark)',
              marginBottom: 4,
            }}
          >
            <KindrCoin size={28} />
            <span>{totalCalcXu} Kindr Xu</span>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--color-secondary-dark)',
              marginBottom: 14,
            }}
          >
            (Tương đương {(totalCalcXu * 10000).toLocaleString('vi-VN')}đ tiền mua đồ mới cho bé!)
          </div>
          <button
            type="button"
            onClick={() => navigate('/post')}
            className="kw-btn kw-btn-primary"
            style={{ width: '100%' }}
          >
            <PlusCircle size={18} />
            <span>Đăng đồ nhận {totalCalcXu} Xu ngay</span>
          </button>
        </div>
      </div>

      {/* Visual 3-Step Beginner Guide Strip (Designed for First-Time Internet Users) */}
      <div
        className="kw-card"
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--color-card)',
          border: '1.5px dashed var(--color-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                backgroundColor: 'var(--color-secondary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 99,
              }}
            >
              Dành cho mẹ mới bắt đầu
            </span>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Cách đổi đồ cho bé chỉ với 3 bước đơn giản
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="kw-btn kw-btn-ghost kw-btn-sm"
            style={{ minHeight: 34, padding: '0 10px', fontSize: 12, color: 'var(--color-primary-dark)' }}
          >
            <HelpCircle size={14} /> Xem chi tiết từng bước
          </button>
        </div>

        <div className="kw-grid-3" style={{ gap: 12 }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-default)',
              backgroundColor: 'var(--color-pastel-pink)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                Chọn đồ ưng ý hoặc Đăng đồ cũ
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                Mỗi món đồ đều có giá Xu rõ ràng (VD: 2 Xu = 20.000đ). Bấm <strong>"Đổi đồ"</strong> là hệ thống giữ món đồ đó cho mẹ ngay.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-default)',
              backgroundColor: 'var(--color-pastel-butter)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                Hẹn gặp trao tay & Đọc mã 6 số
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                Nhắn tin hoặc gọi điện hẹn gặp tại Đà Nẵng. Khi cầm món đồ trên tay, mẹ đọc <strong>Mã 6 số</strong> cho người bán.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-default)',
              backgroundColor: 'var(--color-pastel-mint)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'var(--color-secondary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                Kiểm tra 6 tiếng tại nhà mới trừ Xu
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                Mẹ có thêm <strong>6 tiếng</strong> mang về nhà thử cho bé. Nếu đồ sai mô tả, bấm Khiếu nại để nhận lại 100% Xu!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Category Filter Bar with Playful Nursery Colors */}
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
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Chọn nhóm đồ cho bé yêu</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Bấm vào từng ô màu bên dưới để lọc nhanh theo độ tuổi và loại đồ của bé
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSurveyModalOpen(true)}
              className="kw-btn kw-btn-outline kw-btn-sm"
            >
              <MessageSquareHeart size={15} color="var(--color-primary)" />
              <span>Nhận +5 Xu Tân Thủ</span>
            </button>
            <Link
              to="/donation-station"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-primary-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Gift size={15} /> Trạm Tặng Đồ Miễn Phí (0đ) <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div
          className="kw-bento-cats"
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
                    ? '2.5px solid var(--color-primary)'
                    : '1.5px solid var(--color-border)',
                  backgroundColor: active ? 'var(--color-primary-light)' : cat.bgToken,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: active ? 'var(--shadow-soft)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: 'var(--color-card)',
                      border: active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-soft)',
                    }}
                  >
                    <IconComp size={22} />
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
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Feed Header & Grid */}
      <div id="product-shelf" style={{ scrollMarginTop: 90 }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
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
