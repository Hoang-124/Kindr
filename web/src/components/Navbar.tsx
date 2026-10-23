// d:\Kindr\web\src\components\Navbar.tsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  Bell,
  Shield,
  Gift,
  User as UserIcon,
  LogOut,
  CheckCheck,
  X,
  Lock,
  Sun,
  Moon,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KindrCoin, KindrLogo, Avatar } from './KindrCoin';
import { notificationApi } from '../services/domainServices';
import { timeAgo } from '../utils/pricing';

const ONBOARDING_SLIDES = [
  {
    step: 'Bước 1 / 3',
    badge: 'Định Giá Cố Định • Không Mặc Cả',
    title: 'Dọn nhà thông thái — Biến đồ cũ của bé thành Kindr Xu trong 30 giây',
    desc: 'Không còn cảnh trả giá mất thời gian trên hội nhóm Facebook. Kindr áp dụng Ma trận giá chuẩn theo độ mới (90% / 80% / 70%) với tỷ giá cố định 1 Xu = 10.000đ, kèm AI tự động gợi ý mô tả & mức Xu.',
  },
  {
    step: 'Bước 2 / 3',
    badge: 'Bảo Chứng Kép (Double Escrow)',
    title: 'An tâm tuyệt đối với Cọc 10% Safe Fee & Mã PIN 6 ký tự trao tay',
    desc: 'Khi đăng đồ, Người bán đặt cọc 10% Safe Fee cam kết đúng mô tả. Khi đổi đồ, Người mua nhận Mã PIN 6 ký tự bí mật và chỉ đọc mã này khi trực tiếp gặp mặt kiểm tra và nhận đồ tận tay.',
  },
  {
    step: 'Bước 3 / 3',
    badge: '6 Giờ Safeful Time & Trạm Tặng Đồ 0 Xu',
    title: '6 giờ kiểm định tại nhà & Cộng đồng Mẹ Bỉm Văn Minh Đà Nẵng',
    desc: 'Sau khi nhập mã PIN bàn giao, hệ thống giữ hộ Xu thêm 6 giờ (Safeful Time) để mẹ mang đồ về nhà kiểm tra kỹ. Ngoài ra, mẹ có thể tặng đồ 0 Xu tại 3 Trạm Kindr Hub Đà Nẵng để tích lũy Điểm Văn Minh!',
  },
];

export const Navbar: React.FC = () => {
  const {
    currentUser,
    unreadNotifCount,
    unreadChatCount,
    notifications,
    refreshNotifications,
    theme,
    toggleTheme,
    onboardingOpen,
    setOnboardingOpen,
    toast,
    dismissToast,
    logout,
  } = useApp();

  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const systemNotifs = notifications.filter((n) => n.type !== 'chat_message');

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      await refreshNotifications();
    } catch {
      // Ignore
    }
  };

  const handleNotificationClick = async (n: any) => {
    try {
      if (!n.isRead) {
        await notificationApi.markAsRead(n.id);
        await refreshNotifications();
      }
    } catch {
      // Ignore
    }
    setNotifOpen(false);
    if (n.relatedTransactionId) {
      navigate(`/transactions/${n.relatedTransactionId}`);
    } else if (n.relatedProductId) {
      navigate(`/products/${n.relatedProductId}`);
    } else if (
      n.type === 'topup_success' ||
      n.type === 'withdraw_approved' ||
      n.type === 'withdraw_rejected' ||
      n.type === 'xu_released'
    ) {
      navigate('/wallet');
    }
  };

  return (
    <>
      <header className="kw-navbar">
        <div className="kw-navbar-inner">
          {/* Brand Logo using real kindr-logo.png */}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <KindrLogo size={42} showWordmark tagline="Đổi đồ cho bé • Đà Nẵng" />
          </Link>

          {/* Main Navigation Links */}
          <nav className="kw-nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
            >
              <Home size={17} />
              <span>Khám phá</span>
            </NavLink>

            <NavLink
              to="/search"
              className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
            >
              <Search size={17} />
              <span>Tìm & Bản đồ</span>
            </NavLink>

            <NavLink
              to="/donation-station"
              className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
            >
              <Gift size={17} />
              <span>Trạm Tặng 0 Xu</span>
            </NavLink>

            <button
              type="button"
              onClick={() => {
                setSlideIdx(0);
                setOnboardingOpen(true);
              }}
              className="kw-nav-link"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <HelpCircle size={17} color="var(--color-secondary-dark)" />
              <span>Cách hoạt động</span>
            </button>

            {currentUser && (
              <>
                <NavLink
                  to="/transactions"
                  className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Lock size={17} />
                  <span>Bảo chứng Ký quỹ</span>
                </NavLink>

                <NavLink
                  to="/chat"
                  className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <MessageCircle size={17} />
                  <span>Tin nhắn</span>
                  {unreadChatCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-error)',
                        color: 'var(--color-on-primary)',
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 7px',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {unreadChatCount}
                    </span>
                  )}
                </NavLink>

                {currentUser.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `kw-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Shield size={17} color="var(--color-primary)" />
                    <span>Quản trị Admin</span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="kw-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="kw-btn kw-btn-outline kw-btn-sm"
              style={{ width: 38, minHeight: 38, padding: 0 }}
              title={theme === 'light' ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {currentUser ? (
              <>
                {/* Post Item CTA */}
                <Link to="/post" className="kw-btn kw-btn-primary kw-btn-sm kw-hide-mobile">
                  <PlusCircle size={16} />
                  <span>Đăng đồ</span>
                </Link>

                {/* Live Wallet Balance Pill */}
                <Link
                  to="/wallet"
                  className="kw-badge kw-badge-coin"
                  style={{
                    minHeight: 38,
                    padding: '0 10px',
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Ví Xu của mẹ"
                >
                  <KindrCoin size={16} />
                  <span>{currentUser.xuBalance} Xu</span>
                  {currentUser.xuFrozen > 0 && (
                    <span className="kw-hide-mobile" style={{ fontSize: 12, opacity: 0.8 }}>
                      (Khóa {currentUser.xuFrozen})
                    </span>
                  )}
                </Link>

                {/* Notification Bell */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline kw-btn-sm"
                    onClick={() => {
                      setNotifOpen((prev) => !prev);
                      refreshNotifications();
                    }}
                    style={{ width: 38, minHeight: 38, padding: 0, position: 'relative' }}
                    aria-label="Thông báo"
                  >
                    <Bell size={17} />
                    {unreadNotifCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: 'var(--color-error)',
                          color: 'var(--color-on-primary)',
                          borderRadius: 'var(--radius-full)',
                          minWidth: 18,
                          height: 18,
                          fontSize: 10,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                        }}
                      >
                        {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profile Button */}
                <Link
                  to="/profile"
                  className="kw-hide-mobile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px 4px 6px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    minHeight: 38,
                  }}
                >
                  <Avatar uri={currentUser.avatar} name={currentUser.name} size={30} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      maxWidth: 110,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentUser.name}
                  </span>
                </Link>

                <button
                  type="button"
                  className="kw-btn kw-btn-ghost kw-btn-sm"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Đăng xuất"
                  style={{ width: 36, minHeight: 36, padding: 0 }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link to="/login" className="kw-btn kw-btn-outline kw-btn-sm" style={{ padding: '0 12px', minHeight: 36 }}>
                  <UserIcon size={15} />
                  <span>Đăng nhập</span>
                </Link>
                <Link to="/login?tab=register" className="kw-btn kw-btn-primary kw-btn-sm kw-hide-mobile">
                  <span>Nhận 10 Xu Chào Mừng</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Native-Style Bottom Tab Bar (<= 860px) */}
      <nav className="kw-mobile-bottom-nav" aria-label="Điều hướng di động">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `kw-mobile-tab ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon">
            <Home size={19} />
          </span>
          <span>Khám phá</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `kw-mobile-tab ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon">
            <Search size={19} />
          </span>
          <span>Bản đồ</span>
        </NavLink>

        <NavLink
          to="/post"
          className={({ isActive }) => `kw-mobile-tab kw-mobile-tab-cta ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon">
            <PlusCircle size={20} />
          </span>
          <span>Đăng đồ</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `kw-mobile-tab ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon">
            <Lock size={19} />
          </span>
          <span>Ký quỹ</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) => `kw-mobile-tab ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon" style={{ position: 'relative' }}>
            <MessageCircle size={19} />
            {unreadChatCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  backgroundColor: 'var(--color-error)',
                  color: '#fff',
                  borderRadius: 99,
                  minWidth: 16,
                  height: 16,
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </span>
          <span>Tin nhắn</span>
        </NavLink>

        <NavLink
          to={currentUser?.role === 'admin' ? '/admin' : currentUser ? '/profile' : '/login'}
          className={({ isActive }) => `kw-mobile-tab ${isActive ? 'active' : ''}`}
        >
          <span className="kw-mobile-tab-icon">
            {currentUser?.role === 'admin' ? <Shield size={19} /> : <UserIcon size={19} />}
          </span>
          <span>{currentUser?.role === 'admin' ? 'Admin' : 'Cá nhân'}</span>
        </NavLink>
      </nav>

      {/* Compact Notification Popover (outside navbar backdrop-filter, with outside click & X button) */}
      {notifOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1180,
              backgroundColor: 'transparent',
            }}
            onClick={() => setNotifOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              right: 12,
              top: 60,
              width: 'min(320px, calc(100vw - 24px))',
              maxHeight: 'min(350px, 48dvh)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-default)',
              boxShadow: 'var(--shadow-elevated)',
              zIndex: 1190,
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                flexShrink: 0,
                backgroundColor: 'var(--color-card)',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 13 }}>
                Thông báo ({unreadNotifCount})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="kw-btn kw-btn-ghost kw-btn-sm"
                    style={{ minHeight: 28, padding: '0 8px', fontSize: 11 }}
                  >
                    <CheckCheck size={13} /> Đọc hết
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="kw-btn kw-btn-ghost kw-btn-sm"
                  style={{ minHeight: 28, width: 28, padding: 0 }}
                  aria-label="Đóng thông báo"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {systemNotifs.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 12,
                  }}
                >
                  Chưa có thông báo mới nào.
                </div>
              ) : (
                systemNotifs.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: n.isRead
                        ? 'var(--color-card)'
                        : 'var(--color-primary-light)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: 'var(--color-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {n.title}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-dim)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {n.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--color-border)',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-subtle)',
                flexShrink: 0,
              }}
            >
              <Link
                to="/notifications"
                onClick={() => setNotifOpen(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                }}
              >
                Xem tất cả tại Trung tâm Thông báo →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* 3-Slide Interactive Onboarding Modal (matching Mobile OnboardingScreen.tsx) */}
      {onboardingOpen && (
        <div className="kw-modal-backdrop" onClick={() => setOnboardingOpen(false)}>
          <div
            className="kw-modal-box"
            style={{ maxWidth: 560, textAlign: 'center', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <span className="kw-badge kw-badge-teal" style={{ fontSize: 11 }}>
                {ONBOARDING_SLIDES[slideIdx].step} — {ONBOARDING_SLIDES[slideIdx].badge}
              </span>
              <button
                type="button"
                onClick={() => setOnboardingOpen(false)}
                className="kw-btn kw-btn-ghost kw-btn-sm"
                style={{ minHeight: 32, padding: 6, flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: 108,
                height: 108,
                margin: '0 auto 14px',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-secondary-light)',
                border: '2px solid var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/assets/images/kindr-mascot-full.png"
                alt="Kindr Mascot"
                style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              />
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
              {ONBOARDING_SLIDES[slideIdx].title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: 16 }}>
              {ONBOARDING_SLIDES[slideIdx].desc}
            </p>

            {/* Feature Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 18,
                textAlign: 'left',
              }}
            >
              <div style={{ padding: 10, borderRadius: 12, backgroundColor: 'var(--color-surface-subtle)', fontSize: 11 }}>
                <Sparkles size={15} color="var(--color-primary)" />
                <div style={{ fontWeight: 800, marginTop: 4 }}>1 Xu = 10k</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Giá cố định</div>
              </div>
              <div style={{ padding: 10, borderRadius: 12, backgroundColor: 'var(--color-surface-subtle)', fontSize: 11 }}>
                <ShieldCheck size={15} color="var(--color-secondary-dark)" />
                <div style={{ fontWeight: 800, marginTop: 4 }}>Cọc 10%</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Đúng mô tả</div>
              </div>
              <div style={{ padding: 10, borderRadius: 12, backgroundColor: 'var(--color-surface-subtle)', fontSize: 11 }}>
                <Clock size={15} color="var(--color-warning)" />
                <div style={{ fontWeight: 800, marginTop: 4 }}>6h Kiểm đồ</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Safeful Time</div>
              </div>
            </div>

            {/* Dots + Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <button
                type="button"
                disabled={slideIdx === 0}
                onClick={() => setSlideIdx((s) => Math.max(0, s - 1))}
                className="kw-btn kw-btn-outline kw-btn-sm"
              >
                <ArrowLeft size={15} /> Trước
              </button>

              <div style={{ display: 'flex', gap: 6 }}>
                {ONBOARDING_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlideIdx(i)}
                    style={{
                      width: i === slideIdx ? 20 : 8,
                      height: 8,
                      borderRadius: 99,
                      border: 'none',
                      backgroundColor:
                        i === slideIdx ? 'var(--color-primary)' : 'var(--color-border-strong)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>

              {slideIdx < ONBOARDING_SLIDES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setSlideIdx((s) => s + 1)}
                  className="kw-btn kw-btn-primary kw-btn-sm"
                >
                  Tiếp theo <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingOpen(false);
                    if (!currentUser) navigate('/login');
                  }}
                  className="kw-btn kw-btn-primary kw-btn-sm"
                >
                  {currentUser ? 'Khám phá' : 'Trải nghiệm'} <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Floating Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            right: 12,
            left: 12,
            marginLeft: 'auto',
            zIndex: 1300,
            maxWidth: 340,
            backgroundColor: 'var(--color-card)',
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-default)',
            boxShadow: 'var(--shadow-elevated)',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            onClick={() => {
              if (toast.link) navigate(toast.link);
              dismissToast();
            }}
            style={{ cursor: toast.link ? 'pointer' : 'default', flex: 1, minWidth: 0 }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
              {toast.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="kw-btn kw-btn-ghost kw-btn-sm"
            style={{ minHeight: 26, width: 26, padding: 0, flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
};
