// d:\Kindr\web\src\pages\WalletPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  ShieldCheck,
  QrCode,
  Sparkles,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { walletApi } from '../services/domainServices';
import { socketService } from '../services/socketService';
import { TopupOrderData, WithdrawRequestItem } from '../types';
import { getWithdrawableXu } from '../utils/walletRules';
import {
  formatXuToVND,
  formatNumber,
  formatFullDate,
  XU_TO_VND_RATE,
} from '../utils/pricing';
import { KindrCoin, MascotIcon } from '../components/KindrCoin';

const TOPUP_PACKAGES = [
  { xu: 5, label: 'Gói Trải Nghiệm', badge: 'Phổ biến' },
  { xu: 10, label: 'Gói Mẹ Thông Thái', badge: 'Đổi được 2-5 món' },
  { xu: 20, label: 'Gói Tủ Đồ Cho Bé', badge: 'Đổi xe đẩy / nôi' },
  { xu: 50, label: 'Gói Đại Gia Đình', badge: 'Tiết kiệm thời gian' },
];

const VIETNAM_BANKS = [
  'MB Bank (Ngân hàng Quân Đội)',
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'VietinBank (CTG)',
  'BIDV',
  'ACB (Á Châu)',
  'TPBank',
  'VPBank',
];

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, transactions, refreshUser, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'topup' | 'withdraw' | 'history'>('topup');
  const [selectedXu, setSelectedXu] = useState<number>(10);
  const [topupOrder, setTopupOrder] = useState<TopupOrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Withdraw state
  const [withdrawXu, setWithdrawXu] = useState<number>(10);
  const [bankName, setBankName] = useState<string>(VIETNAM_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>(
    currentUser?.name ? currentUser.name.toUpperCase() : ''
  );
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // History state
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequestItem[]>([]);
  const [topupHistory, setTopupHistory] = useState<TopupOrderData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadHistory = async () => {
    if (!currentUser) return;
    setLoadingHistory(true);
    try {
      const data = await walletApi.getHistory();
      setWithdrawHistory(data.withdrawals);
      setTopupHistory(data.topups || []);
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadHistory();
    }
  }, [currentUser?.id]);

  // Poll VietQR order status if pending & listen to socket
  useEffect(() => {
    if (!topupOrder || topupOrder.status !== 'pending') return;

    const handleSuccess = async (xu: number) => {
      setTopupOrder((prev) => (prev ? { ...prev, status: 'completed' } : null));
      await refreshUser();
      await loadHistory();
      if ((window as any).confetti) {
        (window as any).confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      showToast({
        title: 'Nạp Xu VietQR thành công! 🎉',
        message: `Ví của mẹ đã được cộng thêm +${xu} Xu.`,
        type: 'success',
      });
    };

    const interval = setInterval(async () => {
      try {
        const res = await walletApi.checkOrderStatus(topupOrder.orderCode);
        if (res.status === 'completed' || res.status === 'PAID') {
          handleSuccess(res.xuAmount || topupOrder.xuAmount);
        }
      } catch {
        // Ignore polling error
      }
    }, 2000);

    const handleSocket = (data: any) => {
      if (String(data.orderCode) === String(topupOrder.orderCode) || data.newBalance !== undefined) {
        handleSuccess(data.xuAmount || topupOrder.xuAmount);
      }
    };
    socketService.on('topup_success', handleSocket);

    return () => {
      clearInterval(interval);
      socketService.off('topup_success', handleSocket);
    };
  }, [topupOrder?.orderCode, topupOrder?.status, refreshUser, showToast]);

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 480, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={60}
            dialogue="Đăng nhập để quản lý Ví Xu Kindr, nạp VietQR tự động và rút tiền về ngân hàng nhé!"
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>Ví Kindr Xu</h2>
          <button
            className="kw-btn kw-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  const withdrawableXu = getWithdrawableXu(currentUser);
  const welcomeCredit = currentUser.welcomeCreditRemaining || 0;

  const handleCreateVietQrOrder = async () => {
    setErrorMsg('');
    setLoadingOrder(true);
    try {
      const order = await walletApi.createOrder(selectedXu);
      setTopupOrder(order);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể khởi tạo mã VietQR lúc này.');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleInstantDemoTopup = async () => {
    setErrorMsg('');
    setDemoLoading(true);
    try {
      await walletApi.demoTopup(selectedXu);
      await refreshUser();
      setTopupOrder(null);
      showToast({
        title: `Đã nạp +${selectedXu} Xu thành công!`,
        message: `Số dư mới của mẹ đã được cập nhật tức thì.`,
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          'Chế độ nạp nhanh chỉ khả dụng trên môi trường thử nghiệm. Vui lòng quét mã VietQR.'
      );
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (withdrawXu < 10) {
      setErrorMsg('Số lượng rút tối thiểu là 10 Xu (10.000đ).');
      return;
    }

    if (withdrawXu > withdrawableXu) {
      setErrorMsg(
        `Số Xu có thể rút tối đa của mẹ là ${withdrawableXu} Xu (10 Xu thưởng chào mừng dùng để đổi đồ, không rút tiền mặt).`
      );
      return;
    }

    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      setErrorMsg('Vui lòng nhập số tài khoản ngân hàng hợp lệ.');
      return;
    }

    if (!accountHolder.trim()) {
      setErrorMsg('Vui lòng nhập tên chủ tài khoản ngân hàng.');
      return;
    }

    setWithdrawLoading(true);
    try {
      await walletApi.requestWithdraw({
        xuAmount: withdrawXu,
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });
      await Promise.all([refreshUser(), loadHistory()]);
      setAccountNumber('');
      setActiveTab('history');
      showToast({
        title: 'Đã gửi lệnh rút Xu!',
        message: `Yêu cầu rút ${withdrawXu} Xu về ${bankName} đang chờ Admin duyệt giải ngân.`,
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể gửi yêu cầu rút Xu.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const grossVnd = withdrawXu * XU_TO_VND_RATE;
  const feeVnd = Math.round(grossVnd * 0.1);
  const netPayoutVnd = grossVnd - feeVnd;

  return (
    <div className="kw-container" style={{ padding: '28px 16px 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
          Ví Kindr Xu & Thanh khoản VietQR
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
          Tỷ giá chuẩn: <strong>1 Xu = 1.000 VNĐ</strong> • Tự động đối soát qua SePay VietQR & Ký quỹ Double Escrow
        </p>
      </div>

      {/* 3 BALANCE CARDS */}
      <div className="kw-grid-3" style={{ marginBottom: 24 }}>
        <div
          className="kw-card"
          style={{
            padding: 24,
            background:
              'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-card) 100%)',
            border: '1.5px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              Số dư khả dụng
            </span>
            <Wallet size={20} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <KindrCoin size={28} />
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {currentUser.xuBalance} Xu
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Tương đương <strong>{formatXuToVND(currentUser.xuBalance)}</strong>
          </div>
        </div>

        <div className="kw-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              Đang khóa Ký quỹ (Escrow)
            </span>
            <Lock size={20} color="var(--color-coin-text)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-coin-text)' }}>
              {currentUser.xuFrozen} Xu
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Xu bảo vệ giao dịch đang diễn ra & cọc 10% Safe Fee
          </div>
        </div>

        <div className="kw-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              Xu có thể rút tiền mặt
            </span>
            <Landmark size={20} color="var(--color-secondary-dark)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-secondary-dark)' }}>
              {withdrawableXu} Xu
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {welcomeCredit > 0
              ? `Đã tách riêng ${welcomeCredit} Xu thưởng khởi nghiệp (chỉ dùng đổi đồ)`
              : '100% số dư khả dụng có thể rút về ngân hàng'}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="kw-tab-bar" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('topup')}
          className={activeTab === 'topup' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <ArrowDownLeft size={17} />
          <span>Nạp Xu qua VietQR</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={activeTab === 'withdraw' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <ArrowUpRight size={17} />
          <span>Rút Xu về Ngân hàng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'kw-btn kw-btn-primary' : 'kw-btn kw-btn-outline'}
        >
          <RefreshCw size={16} />
          <span>Lịch sử Biến động & Rút Xu</span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 'var(--radius-default)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: TOPUP */}
      {activeTab === 'topup' && (
        <div className="kw-split-detail">
          <div className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>
              Chọn gói Xu muốn nạp
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
              Nạp Xu để nhận ngay những món đồ yêu thích khi chưa kịp đăng đồ cũ lên sàn.
            </p>

            <div className="kw-grid-2" style={{ marginBottom: 20 }}>
              {TOPUP_PACKAGES.map((pkg) => {
                const active = selectedXu === pkg.xu;
                return (
                  <div
                    key={pkg.xu}
                    onClick={() => {
                      setSelectedXu(pkg.xu);
                      setTopupOrder(null);
                    }}
                    style={{
                      padding: 18,
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="kw-badge kw-badge-primary">{pkg.badge}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        {pkg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <KindrCoin size={24} />
                      <span style={{ fontSize: 24, fontWeight: 800 }}>{pkg.xu} Xu</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary-dark)', marginTop: 4 }}>
                      {formatXuToVND(pkg.xu)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="kw-btn kw-btn-primary"
                onClick={handleCreateVietQrOrder}
                disabled={loadingOrder}
              >
                <QrCode size={18} />
                <span>
                  {loadingOrder
                    ? 'Đang tạo mã VietQR...'
                    : `Tạo mã VietQR (${formatXuToVND(selectedXu)})`}
                </span>
              </button>

              
            </div>
          </div>

          <div className="kw-card" style={{ padding: 24 }}>
            {!topupOrder ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <QrCode size={48} color="var(--color-primary)" style={{ marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>
                  Thanh toán tự động 24/7 qua VietQR
                </h4>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Bấm nút <strong>"Tạo mã VietQR"</strong> để hiển thị mã QR thanh toán. Quét mã xong hệ thống sẽ tự động nhận diện và cộng Xu ngay!
                </p>
              </div>
            ) : topupOrder.status === 'completed' ? (
              /* MÀN HÌNH GIAO DỊCH THÀNH CÔNG (QUÉT XONG TỰ ĐỘNG HIỆN LÊN & CỘNG XU) */
              <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    backgroundColor: '#E8F7F3',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle2 size={40} />
                </div>
                <span className="kw-badge kw-badge-primary" style={{ marginBottom: 8, display: 'inline-block' }}>
                  Thanh toán thành công
                </span>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: '#2D2325', margin: '4px 0 6px' }}>
                  Giao dịch đã thành công! 🎉
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
                  Đã cộng thành công <strong style={{ color: '#10B981' }}>+{topupOrder.xuAmount} Xu</strong> vào ví của mẹ.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-default)',
                    padding: 16,
                    textAlign: 'left',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Mã đơn hàng:</span>
                    <strong>{topupOrder.orderCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Số tiền đã nạp:</span>
                    <strong>{formatNumber(topupOrder.vndAmount)}đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Số Xu nhận được:</span>
                    <strong style={{ color: '#D97706' }}>+{topupOrder.xuAmount} Xu</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="kw-btn kw-btn-primary"
                    onClick={() => {
                      setTopupOrder(null);
                      navigate('/');
                    }}
                  >
                    <span>Khám phá đồ bé &amp; Đổi ngay</span>
                  </button>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline"
                    onClick={() => setTopupOrder(null)}
                  >
                    <span>Nạp thêm đơn khác</span>
                  </button>
                </div>
              </div>
            ) : (
              /* MÀN HÌNH CHỜ QUÉT MÃ VIETQR (ĐÃ BỎ NÚT MÔ PHỎNG) */
              <div style={{ textAlign: 'center' }}>
                <span className="kw-badge kw-badge-secondary">
                  Đang chờ quét mã QR...
                </span>
                <h4 style={{ fontSize: 17, fontWeight: 800, margin: '10px 0' }}>
                  Quét mã bằng ứng dụng Ngân hàng bất kỳ
                </h4>
                {(() => {
                  const rawUrl = topupOrder.vietqrUrl || '';
                  const qrSrc = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
                    ? rawUrl
                    : rawUrl.startsWith('000201')
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(rawUrl)}`
                    : `https://img.vietqr.io/image/970422-${topupOrder.accountNumber}-compact2.png?amount=${topupOrder.vndAmount}&addInfo=${encodeURIComponent(topupOrder.memo)}`;

                  return (
                    <img
                      src={qrSrc}
                      alt="VietQR"
                      onError={(e) => {
                        const fallback = `https://img.vietqr.io/image/970422-${topupOrder.accountNumber}-compact2.png?amount=${topupOrder.vndAmount}&addInfo=${encodeURIComponent(topupOrder.memo)}`;
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      style={{
                        width: 240,
                        height: 240,
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-default)',
                        border: '1px solid var(--color-border)',
                        margin: '8px auto 16px',
                        display: 'block',
                        backgroundColor: '#fff',
                      }}
                    />
                  );
                })()}
                <div
                  style={{
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 'var(--radius-default)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Ngân hàng:</span>
                    <strong>{topupOrder.bankName || 'MBBank'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Số tài khoản:</span>
                    <strong>{topupOrder.accountNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Số tiền:</span>
                    <strong style={{ color: 'var(--color-primary-dark)' }}>
                      {formatNumber(topupOrder.vndAmount)}đ ({topupOrder.xuAmount} Xu)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Nội dung CK:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--color-secondary-dark)' }}>{topupOrder.memo}</strong>
                      <button
                        type="button"
                        className="kw-btn kw-btn-ghost kw-btn-sm"
                        style={{ minHeight: 28, padding: '0 8px' }}
                        onClick={() => {
                          navigator.clipboard?.writeText(topupOrder.memo);
                          showToast({
                            title: 'Đã sao chép nội dung CK',
                            message: topupOrder.memo,
                            type: 'info',
                          });
                        }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Clock size={14} />
                  <span>Hệ thống tự động kiểm tra mỗi 2 giây sau khi bạn chuyển khoản...</span>
                </div>
              </div>
            )}          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div className="kw-split-detail">
          <form onSubmit={handleRequestWithdraw} className="kw-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>
              Rút Xu tích lũy về tài khoản Ngân hàng
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
              Xu kiếm được từ việc bán đồ cho các mẹ khác có thể rút về ngân hàng bất cứ lúc nào (Tối thiểu 10 Xu).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Số lượng Xu muốn rút (Tối đa có thể rút: {withdrawableXu} Xu)
              </label>
              <input
                type="number"
                min={10}
                max={Math.max(10, withdrawableXu)}
                className="kw-input"
                value={withdrawXu}
                onChange={(e) => setWithdrawXu(Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Ngân hàng thụ hưởng
              </label>
              <select
                className="kw-select"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="kw-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="Nhập số tài khoản..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Tên chủ tài khoản (Không dấu) *
                </label>
                <input
                  type="text"
                  className="kw-input"
                  placeholder="VD: NGUYEN THI MINH ANH"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <button
              type="submit"
              className="kw-btn kw-btn-primary"
              disabled={withdrawLoading || withdrawableXu < 10}
            >
              <CheckCircle2 size={18} />
              <span>
                {withdrawLoading
                  ? 'Đang gửi yêu cầu...'
                  : `Gửi yêu cầu rút ${withdrawXu} Xu`}
              </span>
            </button>
          </form>

          <div className="kw-card" style={{ padding: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 14px' }}>
              Bảng tính minh bạch số tiền thực nhận
            </h4>

            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Giá trị quy đổi ({withdrawXu} Xu):</span>
                <strong>{formatNumber(grossVnd)}đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Phí vận hành hạ tầng & cổng thanh toán (10%):
                </span>
                <strong style={{ color: 'var(--color-error)' }}>-{formatNumber(feeVnd)}đ</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 16,
                  paddingTop: 10,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontWeight: 800 }}>Số tiền thực nhận (90%):</span>
                <strong style={{ color: 'var(--color-success)' }}>{formatNumber(netPayoutVnd)}đ</strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: 14,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-secondary-light)',
                fontSize: 12,
                color: 'var(--color-secondary-dark)',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Mẹo tiết kiệm: Mẹ dùng Xu để đổi lấy đồ dùng mới cho bé trên Kindr sẽ được giữ nguyên <strong>100% giá trị</strong> (không mất 10% phí rút tiền mặt)!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="kw-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
            Lịch sử Đơn Nạp Xu VietQR ({topupHistory.length})
          </h3>
          {loadingHistory ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Đang tải lịch sử...
            </div>
          ) : topupHistory.length === 0 ? (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Chưa có đơn nạp Xu nào.
            </div>
          ) : (
            <div className="kw-table-wrap" style={{ marginBottom: 28 }}>
              <table className="kw-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Mã đơn / Nội dung CK</th>
                    <th>Số Xu nạp</th>
                    <th>Số tiền (VNĐ)</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {topupHistory.map((order) => (
                    <tr key={order.orderCode}>
                      <td>{formatFullDate(order.createdAt)}</td>
                      <td>
                        <strong style={{ fontSize: 12 }}>{order.memo || order.orderCode}</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-success)' }}>+{order.xuAmount} Xu</strong>
                      </td>
                      <td>{formatNumber(order.vndAmount)}đ</td>
                      <td>
                        {order.status === 'completed' ? (
                          <span className="kw-badge kw-badge-success">Đã cộng Xu</span>
                        ) : order.status === 'expired' ? (
                          <span className="kw-badge kw-badge-neutral">Hết hạn</span>
                        ) : (
                          <span className="kw-badge kw-badge-warning">Chờ chuyển khoản</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
            Lịch sử Yêu cầu Rút Xu ({withdrawHistory.length})
          </h3>

          {loadingHistory ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Đang tải lịch sử...
            </div>
          ) : withdrawHistory.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Chưa có yêu cầu rút tiền nào.
            </div>
          ) : (
            <div className="kw-table-wrap" style={{ marginBottom: 28 }}>
              <table className="kw-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Số Xu rút</th>
                    <th>Thực nhận (90%)</th>
                    <th>Ngân hàng thụ hưởng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{formatFullDate(item.createdAt)}</td>
                      <td>
                        <strong>-{item.xuAmount} Xu</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-success)' }}>
                          {formatNumber(item.payoutVnd)}đ
                        </strong>
                      </td>
                      <td>
                        {item.bankName} • {item.accountNumber} ({item.accountHolder})
                      </td>
                      <td>
                        {item.status === 'approved' ? (
                          <span className="kw-badge kw-badge-success">Đã chuyển khoản</span>
                        ) : item.status === 'rejected' ? (
                          <span className="kw-badge kw-badge-error">Đã hoàn Xu ({item.adminNote || 'Từ chối'})</span>
                        ) : (
                          <span className="kw-badge kw-badge-warning">Chờ Admin duyệt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
            Biến động Giao dịch Double Escrow ({transactions.length})
          </h3>
          {transactions.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Chưa có giao dịch trao đổi đồ nào.
            </div>
          ) : (
            <div className="kw-table-wrap">
              <table className="kw-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Món đồ</th>
                    <th>Vai trò</th>
                    <th>Biến động Xu</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isBuyerRole = tx.buyerId === currentUser.id;
                    return (
                      <tr
                        key={tx.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/transactions/${tx.id}`)}
                      >
                        <td>{formatFullDate(tx.createdAt)}</td>
                        <td>
                          <strong>{tx.productName}</strong>
                        </td>
                        <td>{isBuyerRole ? 'Nhận đồ' : 'Đăng bán'}</td>
                        <td>
                          <strong
                            style={{
                              color: isBuyerRole ? 'var(--color-error)' : 'var(--color-success)',
                            }}
                          >
                            {isBuyerRole ? `-${tx.productPrice} Xu` : `+${tx.productPrice} Xu`}
                          </strong>
                        </td>
                        <td>
                          {tx.status === 'completed' ? (
                            <span className="kw-badge kw-badge-success">Hoàn tất</span>
                          ) : tx.status === 'disputed' ? (
                            <span className="kw-badge kw-badge-error">Đang khiếu nại</span>
                          ) : tx.status === 'refunded' ? (
                            <span className="kw-badge kw-badge-neutral">Đã hoàn Xu / Hủy</span>
                          ) : (
                            <span className="kw-badge kw-badge-warning">Đang giữ cọc</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
