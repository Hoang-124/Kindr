// d:\Kindr\web\src\pages\AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  Sparkles,
  UserCheck,
  KeyRound,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/domainServices';
import { DANANG_DISTRICTS } from '../utils/locations';
import { MascotIcon, KindrCoin } from '../components/KindrCoin';
import { AddressMapPreview } from '../components/AddressMapPreview';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

type AuthMode = 'login' | 'register' | 'activate' | 'forgot';

const DEMO_ACCOUNTS = [
  {
    label: 'Mẹ Hoa Lan (Người Bán • 35 Xu)',
    phone: '0905123456',
    roleBadge: '98đ Văn Minh',
  },
  {
    label: 'Mẹ Bắp (Người Mua • 25 Xu)',
    phone: '0905234567',
    roleBadge: '95đ Văn Minh',
  },
  {
    label: 'Mẹ Ngọc Ánh (Thành viên • 50 Xu)',
    phone: '0905345678',
    roleBadge: '100đ Văn Minh',
  },
  {
    label: 'Ban Quản Trị Kindr (Admin Root)',
    phone: '0900000000',
    roleBadge: 'Admin Portal',
  },
];

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AuthMode) || 'login';

  const [mode, setMode] = useState<AuthMode>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Login State
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regDistrictId, setRegDistrictId] = useState('dn_haichau');
  const [regAddress, setRegAddress] = useState('');

  // Activate Account OTP State
  const [activateEmail, setActivateEmail] = useState('');
  const [activateOtp, setActivateOtp] = useState('');

  // Forgot Password 3-Step State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const { setCurrentUser, refreshProducts, refreshTransactions, showToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get('tab') as AuthMode;
    if (t && ['login', 'register', 'activate', 'forgot'].includes(t)) {
      setMode(t);
    }
  }, [searchParams]);

  const handleGoogleSuccess = async (result: { user: any; isNewUser: boolean; message?: string }) => {
    setCurrentUser(result.user);
    await Promise.all([refreshProducts(), refreshTransactions()]);
    showToast({
      title: result.isNewUser
        ? `Chào mừng ${result.user.name}! Tặng 10 Xu Chào Mừng`
        : `Đăng nhập Google thành công: ${result.user.name}`,
      message: `Trong ví của mẹ hiện có ${result.user.xuBalance} Xu • Điểm văn minh: ${result.user.civilizationPoints}/100`,
      type: 'success',
    });
    navigate(result.user.role === 'admin' ? '/admin' : '/');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (!loginInput.trim() || !loginPassword) {
      setError('Vui lòng nhập Số điện thoại / Email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.login(loginInput.trim(), loginPassword);
      setCurrentUser(user);
      await Promise.all([refreshProducts(), refreshTransactions()]);
      showToast({
        title: `Chào mừng ${user.name}!`,
        message: `Trong ví của mẹ hiện có ${user.xuBalance} Xu.`,
        type: 'success',
      });
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.needsActivation && data?.email) {
        setActivateEmail(data.email);
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
          setActivateOtp(data.devOtp);
        }
        setMode('activate');
        setInfoMsg('Tài khoản cần kích hoạt mã OTP 6 số đã gửi vào email của mẹ.');
      } else {
        setError(data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccount = async (phone: string) => {
    setError('');
    setLoading(true);
    try {
      const { user } = await authApi.login(phone, '123456');
      setCurrentUser(user);
      await Promise.all([refreshProducts(), refreshTransactions()]);
      showToast({
        title: `Đã đăng nhập: ${user.name}`,
        message: `Số dư hiện tại: ${user.xuBalance} Xu • Điểm văn minh: ${user.civilizationPoints}/100`,
        type: 'success',
      });
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch {
      try {
        const user = await authApi.demoLogin();
        setCurrentUser(user);
        await Promise.all([refreshProducts(), refreshTransactions()]);
        showToast({
          title: `Đã đăng nhập Demo: ${user.name}`,
          message: `Số dư hiện tại: ${user.xuBalance} Xu`,
          type: 'success',
        });
        navigate('/');
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            'Không thể kết nối máy chủ Backend (cổng 5000). Hãy đảm bảo server đang chạy.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!regName.trim() || !regPhone.trim() || !regPassword) {
      setError('Vui lòng điền Họ tên, Số điện thoại và Mật khẩu.');
      return;
    }
    if (regName.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!/^0\d{9}$/.test(regPhone.trim())) {
      setError('Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0905123456).');
      return;
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    const cleanEmail = regEmail.trim().toLowerCase();
    const districtObj = DANANG_DISTRICTS.find((d) => d.id === regDistrictId) || DANANG_DISTRICTS[0];

    setLoading(true);
    try {
      const res = await authApi.register({
        name: regName.trim(),
        phone: regPhone.trim(),
        email: cleanEmail || undefined,
        password: regPassword,
        location: {
          districtId: districtObj.id,
          districtName: districtObj.name,
          addressDetail: regAddress.trim() || districtObj.name,
        },
      });

      if (res.needsActivation && res.email) {
        setActivateEmail(res.email);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
          setActivateOtp(res.devOtp);
        }
        setMode('activate');
        setInfoMsg(res.message || 'Vui lòng nhập mã OTP 6 số gửi tới email của mẹ.');
      } else if (res.user) {
        setCurrentUser(res.user);
        showToast({
          title: 'Đăng ký thành công! Tặng 10 Xu Chào Mừng',
          message: `Ví của mẹ hiện có ${res.user.xuBalance} Xu để bắt đầu đổi đồ cho bé.`,
          type: 'success',
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể đăng ký tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!activateEmail.trim() || !activateOtp.trim()) {
      setError('Vui lòng nhập đầy đủ Email và mã OTP 6 chữ số.');
      return;
    }
    setLoading(true);
    try {
      const user = await authApi.activateAccount(activateEmail.trim(), activateOtp.trim());
      setCurrentUser(user);
      showToast({
        title: 'Kích hoạt tài khoản thành công!',
        message: `Chào mừng ${user.name} đến với cộng đồng Kindr.`,
        type: 'success',
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await authApi.sendForgotPasswordOtp(forgotEmail.trim());
        if (res?.devOtp) {
          setDevOtpHint(res.devOtp);
          setForgotOtp(res.devOtp);
        }
        setForgotStep(2);
        setInfoMsg('Đã gửi mã OTP 6 chữ số tới hòm thư của mẹ.');
      } else if (forgotStep === 2) {
        await authApi.verifyForgotOtp(forgotEmail.trim(), forgotOtp.trim());
        setForgotStep(3);
        setInfoMsg('Mã OTP hợp lệ! Hãy nhập mật khẩu mới.');
      } else {
        await authApi.resetPasswordWithOtp(
          forgotEmail.trim(),
          forgotOtp.trim(),
          forgotNewPassword
        );
        setMode('login');
        setLoginInput(forgotEmail.trim());
        setInfoMsg('Đổi mật khẩu thành công! Mẹ hãy đăng nhập bằng mật khẩu mới nhé.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra trong quá trình khôi phục mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-6)',
        alignItems: 'start',
        paddingTop: 'var(--space-3)',
      }}
    >
      {/* Left Column: Brand Value & Quick Demo Accounts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="kw-card" style={{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
          <div style={{ marginBottom: 16 }}>
            <MascotIcon
              size={58}
              dialogue="Chào mừng mẹ đến với ngôi nhà chung Kindr! Tạo tài khoản nhận ngay 10 Xu Chào Mừng nhé!"
            />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>
            Đổi đồ cho con. Nhẹ ví cho mẹ. Bảo chứng Ký Quỹ Kép 100%.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Không mặc cả, không lo bùng hàng hay đồ kém chất lượng nhờ cơ chế khóa 10% Safe Fee người bán và 6 Giờ Kiểm Định Tại Nhà.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
              <ShieldCheck size={18} color="var(--color-primary-dark)" />
              <span>Quy chuẩn tỷ giá cố định: 1 Xu = 10.000 VNĐ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
              <Clock size={18} color="var(--color-primary-dark)" />
              <span>Bàn giao bằng mã PIN 6 ký tự & 6h Safeful Time kiểm định tại nhà</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
              <Sparkles size={18} color="var(--color-primary-dark)" />
              <span>Tự động cộng +5 Xu Tiên Phong nếu email/SĐT nằm trong Top 200 Waitlist</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Login Panel */}
        <div className="kw-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="var(--color-secondary-dark)" />
              <span>Đăng Nhập Nhanh Tài Khoản Mẫu (1-Click Demo)</span>
            </h3>
            <span className="kw-badge kw-badge-teal">Mật khẩu: 123456</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
            Chọn nhanh 1 trong 4 vai trò dưới đây để kiểm thử luồng Đổi đồ, Bàn giao mã PIN, Khiếu nại và Trọng tài Admin:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.phone}
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoAccount(acc.phone)}
                className="kw-btn kw-btn-outline"
                style={{
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <KindrCoin size={18} />
                  <span style={{ fontWeight: 700 }}>{acc.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="kw-badge kw-badge-coral">{acc.roleBadge}</span>
                  <ArrowRight size={15} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Auth Forms */}
      <div className="kw-card">
        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 6,
            borderRadius: 'var(--radius-default)',
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`kw-btn kw-btn-sm ${
              mode === 'login' ? 'kw-btn-primary' : 'kw-btn-ghost'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`kw-btn kw-btn-sm ${
              mode === 'register' ? 'kw-btn-primary' : 'kw-btn-ghost'
            }`}
          >
            Đăng ký (+10 Xu)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setForgotStep(1);
              setError('');
            }}
            className={`kw-btn kw-btn-sm ${
              mode === 'forgot' || mode === 'activate' ? 'kw-btn-primary' : 'kw-btn-ghost'
            }`}
          >
            OTP / Quên MK
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-default)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div
            style={{
              backgroundColor: 'var(--color-secondary-light)',
              color: 'var(--color-secondary-dark)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-default)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {infoMsg}
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Đăng nhập tài khoản Kindr
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Đăng nhập nhanh bằng Google hoặc số điện thoại/email của mẹ.
            </p>

            <div style={{ marginBottom: 16 }}>
              <GoogleSignInButton
                label="Đăng nhập nhanh bằng Google"
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setError(msg)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '16px 0',
                color: 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
              <span>HOẶC BẰNG SĐT / EMAIL</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
            </div>

            <div className="kw-field">
              <label className="kw-label">Số điện thoại hoặc Email</label>
              <input
                type="text"
                className="kw-input"
                placeholder="VD: 0905123456 hoặc lan.hoa@outlook.com"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
              />
            </div>

            <div className="kw-field">
              <label className="kw-label">Mật khẩu</label>
              <input
                type="password"
                className="kw-input"
                placeholder="Nhập mật khẩu"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kw-btn kw-btn-primary kw-btn-lg"
              style={{ width: '100%', marginTop: 8 }}
            >
              <Lock size={17} />
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Kindr'}</span>
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Tạo tài khoản Mẹ Bỉm mới
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Tặng ngay <strong>10 Xu Chào Mừng</strong> và <strong>95 Điểm Văn Minh</strong> (+5 Xu Tiên Phong nếu đã đăng ký Waitlist).
            </p>

            <div style={{ marginBottom: 16 }}>
              <GoogleSignInButton
                label="Đăng ký 1 chạm với Google (+10 Xu)"
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setError(msg)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '16px 0',
                color: 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
              <span>HOẶC ĐĂNG KÝ BẰNG SỐ ĐIỆN THOẠI</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
            </div>

            <div className="kw-grid-2" style={{ gap: 12 }}>
              <div className="kw-field">
                <label className="kw-label">Tên của mẹ *</label>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="VD: Mẹ Minh Anh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>

              <div className="kw-field">
                <label className="kw-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className="kw-input"
                  placeholder="VD: 0905888999"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="kw-field">
              <label className="kw-label">Email (Tùy chọn — dùng để nhận OTP hoặc khớp Waitlist)</label>
              <input
                type="email"
                className="kw-input"
                placeholder="VD: minh.anh@gmail.com (Để trống nếu đăng ký nhanh bằng SĐT)"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="kw-grid-2" style={{ gap: 12 }}>
              <div className="kw-field">
                <label className="kw-label">Mật khẩu *</label>
                <input
                  type="password"
                  className="kw-input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>

              <div className="kw-field">
                <label className="kw-label">Nhập lại mật khẩu *</label>
                <input
                  type="password"
                  className="kw-input"
                  placeholder="Xác nhận mật khẩu"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                />
              </div>
            </div>

            <div className="kw-grid-2" style={{ gap: 12 }}>
              <div className="kw-field">
                <label className="kw-label">Quận / Huyện tại Đà Nẵng</label>
                <select
                  className="kw-select"
                  value={regDistrictId}
                  onChange={(e) => setRegDistrictId(e.target.value)}
                >
                  {DANANG_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kw-field">
                <label className="kw-label">Địa chỉ / Khu chung cư</label>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="VD: FPT Plaza 2, Nguyễn Tất Thành..."
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <AddressMapPreview
                districtId={regDistrictId}
                addressDetail={regAddress}
                height={180}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kw-btn kw-btn-primary kw-btn-lg"
              style={{ width: '100%' }}
            >
              <Sparkles size={17} />
              <span>{loading ? 'Đang khởi tạo...' : 'Đăng ký & Nhận 10 Xu Ngay'}</span>
            </button>
          </form>
        )}

        {/* 3. ACTIVATE ACCOUNT OTP FORM */}
        {mode === 'activate' && (
          <form onSubmit={handleActivateSubmit}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Kích hoạt tài khoản bằng OTP
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Nhập mã OTP 6 chữ số đã được gửi tới email của mẹ để kích hoạt tài khoản và nhận Xu.
            </p>

            {devOtpHint && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning)',
                  marginBottom: 14,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  Mã OTP môi trường Dev: <strong style={{ fontSize: 15 }}>{devOtpHint}</strong>
                </span>
                <button
                  type="button"
                  className="kw-btn kw-btn-secondary kw-btn-sm"
                  onClick={() => setActivateOtp(devOtpHint)}
                >
                  Điền mã
                </button>
              </div>
            )}

            <div className="kw-field">
              <label className="kw-label">Email đăng ký</label>
              <input
                type="email"
                className="kw-input"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
              />
            </div>

            <div className="kw-field">
              <label className="kw-label">Mã OTP 6 chữ số</label>
              <input
                type="text"
                maxLength={6}
                className="kw-input"
                placeholder="Nhập 6 chữ số OTP"
                value={activateOtp}
                onChange={(e) => setActivateOtp(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={loading}
                className="kw-btn kw-btn-primary"
                style={{ flex: 1 }}
              >
                <KeyRound size={16} />
                <span>Xác nhận kích hoạt</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  try {
                    const res = await authApi.resendActivation(activateEmail.trim());
                    if (res?.devOtp) {
                      setDevOtpHint(res.devOtp);
                      setActivateOtp(res.devOtp);
                    }
                    setInfoMsg('Đã gửi lại mã OTP mới vào email của mẹ!');
                  } catch (e: any) {
                    setError(e.response?.data?.error || 'Không thể gửi lại mã.');
                  }
                }}
                className="kw-btn kw-btn-outline"
              >
                Gửi lại OTP
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD 3-STEP FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Khôi phục mật khẩu (Bước {forgotStep}/3)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Hệ thống sẽ gửi mã OTP 6 số qua Email để xác thực và đặt mật khẩu mới.
            </p>

            {forgotStep >= 2 && devOtpHint && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning)',
                  marginBottom: 14,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  Mã OTP môi trường Dev: <strong style={{ fontSize: 15 }}>{devOtpHint}</strong>
                </span>
                <button
                  type="button"
                  className="kw-btn kw-btn-secondary kw-btn-sm"
                  onClick={() => setForgotOtp(devOtpHint)}
                >
                  Điền mã
                </button>
              </div>
            )}

            <div className="kw-field">
              <label className="kw-label">Email tài khoản</label>
              <input
                type="email"
                className="kw-input"
                placeholder="Nhập email đã đăng ký"
                value={forgotEmail}
                disabled={forgotStep > 1}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>

            {forgotStep >= 2 && (
              <div className="kw-field">
                <label className="kw-label">Mã OTP 6 chữ số</label>
                <input
                  type="text"
                  maxLength={6}
                  className="kw-input"
                  placeholder="Nhập 6 số OTP trong email"
                  value={forgotOtp}
                  disabled={forgotStep > 2}
                  onChange={(e) => setForgotOtp(e.target.value)}
                />
              </div>
            )}

            {forgotStep === 3 && (
              <div className="kw-field">
                <label className="kw-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  className="kw-input"
                  placeholder="Nhập mật khẩu mới"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={loading}
                className="kw-btn kw-btn-primary"
                style={{ flex: 1 }}
              >
                <Mail size={16} />
                <span>
                  {forgotStep === 1
                    ? 'Gửi mã OTP'
                    : forgotStep === 2
                    ? 'Xác thực OTP'
                    : 'Đặt lại mật khẩu'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('activate')}
                className="kw-btn kw-btn-outline"
              >
                Kích hoạt TK mới
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
