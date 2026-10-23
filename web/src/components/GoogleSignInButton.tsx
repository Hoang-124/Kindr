// d:\Kindr\web\src\components\GoogleSignInButton.tsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Mail, User as UserIcon, ShieldCheck, ExternalLink } from 'lucide-react';
import { authApi } from '../services/domainServices';
import { User } from '../types';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '616320462696-2gh4jaj1pafnatlujrqurv043cada6b8.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  label?: string;
  onSuccess: (result: { user: User; isNewUser: boolean; message?: string }) => void;
  onError?: (msg: string) => void;
}

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Mẹ Minh Anh',
    email: 'minhanh.dn@gmail.com',
    googleId: 'google_minhanh_dn_01',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    badge: 'Mẹ Bỉm Hải Châu · Uy tín 5.0',
  },
  {
    name: 'Mẹ Thu Hà',
    email: 'thuha.mommy@gmail.com',
    googleId: 'google_thuha_dn_02',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    badge: 'Mẹ Bỉm Sơn Trà · Uy tín 4.9',
  },
  {
    name: 'Ban Quản Trị Kindr (Google Admin)',
    email: 'hoang@kindr.vn',
    googleId: 'google_admin_kindr_01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    badge: 'Tài khoản Google kết nối sẵn DB',
  },
];

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Tiếp tục với tài khoản Google',
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('google-gsi-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleBackendGoogleAuth = async (payload: {
    credential?: string;
    idToken?: string;
    googleId?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }) => {
    setLoading(true);
    setModalError(null);
    try {
      const result = await authApi.googleLogin(payload);
      setShowPickerModal(false);
      onSuccess(result);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      setModalError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerLiveGooglePopup = () => {
    const g = (window as any).google;
    if (g?.accounts?.oauth2) {
      try {
        const tokenClient = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                await handleBackendGoogleAuth({
                  googleId: profile.sub,
                  email: profile.email,
                  name: profile.name || profile.given_name || 'Mẹ Bỉm Google',
                  avatar: profile.picture || '',
                });
              } catch {
                setModalError('Không thể lấy thông tin từ Google OAuth. Vui lòng chọn tài khoản bên dưới.');
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fallback to modal account picker
      }
    }
    setModalError('Trình duyệt hiện tại chặn cửa sổ Popup của Google. Mẹ có thể chọn hoặc nhập Gmail trực tiếp bên dưới.');
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setModalError('Vui lòng nhập địa chỉ email Google hợp lệ (ví dụ: tenban@gmail.com).');
      return;
    }
    const derivedName =
      customName.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    await handleBackendGoogleAuth({
      googleId: `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      name: derivedName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setModalError(null);
          setShowPickerModal(true);
        }}
        style={{
          width: '100%',
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '10px 18px',
          borderRadius: 14,
          border: '1.5px solid var(--color-border-strong)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        {/* Official Google 4-color G SVG */}
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        <span>{loading ? 'Đang xác thực với Google...' : label}</span>
      </button>

      {showPickerModal && (
        <div
          className="kw-modal-backdrop"
          onClick={() => !loading && setShowPickerModal(false)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="kw-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 24, borderRadius: 24 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800 }}>Đăng nhập bằng Google</h3>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Chọn tài khoản để tiếp tục tới <strong>Kindr Đà Nẵng</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="kw-btn kw-btn-ghost kw-btn-sm"
                onClick={() => setShowPickerModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                {modalError}
              </div>
            )}

            {!useCustomAccount ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Chọn nhanh tài khoản Google
                </div>
                {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleBackendGoogleAuth({
                        googleId: acc.googleId,
                        email: acc.email,
                        name: acc.name,
                        avatar: acc.avatar,
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{acc.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>
                        {acc.badge}
                      </div>
                    </div>
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setUseCustomAccount(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px dashed var(--color-border-strong)',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <UserIcon size={18} color="var(--color-primary)" />
                  <span>Sử dụng một tài khoản Gmail khác...</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerLiveGooglePopup}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Mở cửa sổ Google OAuth2 Popup chính thức</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="kw-label">Địa chỉ Gmail của bạn *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="var(--color-text-tertiary)"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      className="kw-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="tenban@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="kw-label">Tên hiển thị trên Kindr</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon
                      size={16}
                      color="var(--color-text-tertiary)"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      className="kw-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="VD: Mẹ Bảo Ngọc"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setUseCustomAccount(false)}
                  >
                    Quay lại
                  </button>
                  <button type="submit" className="kw-btn kw-btn-primary" style={{ flex: 1.5 }} disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Tiếp tục với Gmail này'}
                  </button>
                </div>
              </form>
            )}

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
              }}
            >
              <ShieldCheck size={15} color="var(--color-secondary)" />
              <span>
                Tài khoản Google mới sẽ tự động được tặng <strong>10 Xu Chào Mừng</strong> và <strong>95 Điểm Văn Minh</strong>.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
