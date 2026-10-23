// d:\Kindr\web\src\pages\TransactionDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Copy,
  MessageCircle,
  Star,
  Upload,
  ArrowLeft,
  RefreshCw,
  Phone,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  transactionApi,
  ratingApi,
  uploadApi,
  chatApi,
} from '../services/domainServices';
import { socketService } from '../services/socketService';
import { Transaction } from '../types';
import {
  formatTimeRemaining,
  formatFullDate,
  formatXuToVND,
  maskPhoneNumber,
} from '../utils/pricing';
import { KindrCoin, QrCodeVisual, MascotIcon } from '../components/KindrCoin';

const RATING_TAGS = [
  'Đúng hẹn, thân thiện',
  'Đồ sạch đẹp đúng mô tả',
  'Đóng gói cẩn thận',
  'Mẹ bỉm văn minh Đà Nẵng',
  'Giao dịch nhanh gọn',
];

const DISPUTE_PRESETS = [
  'Món đồ bị hỏng/thiếu chi tiết so với mô tả',
  'Độ mới thực tế thấp hơn nhiều so với cam kết',
  'Giao sai mẫu hoặc không đúng sản phẩm đã đăng',
  'Vấn đề vệ sinh / an toàn cho bé',
];

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    transactions,
    refreshTransactions,
    refreshUser,
    refreshProducts,
    showToast,
  } = useApp();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Handover PIN & QR Scanner state (Seller)
  const [pinInput, setPinInput] = useState('');
  const [qrPayloadInput, setQrPayloadInput] = useState('');
  const [showQrScannerBox, setShowQrScannerBox] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cancel before handover state
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState('Hai bên chưa sắp xếp được lịch hẹn gặp mặt');

  // Live 6h countdown state
  const [countdown, setCountdown] = useState(() =>
    formatTimeRemaining(undefined)
  );

  // Dispute form state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeImages, setDisputeImages] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Rating form state
  const [stars, setStars] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Đúng hẹn, thân thiện',
    'Đồ sạch đẹp đúng mô tả',
  ]);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Load specific transaction when :id changes
  useEffect(() => {
    if (!id) {
      setSelectedTx(null);
      return;
    }
    let mounted = true;
    async function fetchDetail() {
      setLoadingTx(true);
      setErrorMsg('');
      try {
        const detail = await transactionApi.getTransactionById(id!);
        if (mounted) {
          setSelectedTx(detail);
        }
      } catch {
        const fallback = transactions.find((t) => t.id === id);
        if (mounted && fallback) setSelectedTx(fallback);
      } finally {
        if (mounted) setLoadingTx(false);
      }
    }
    fetchDetail();

    const refreshActiveTx = async () => {
      if (!mounted || document.hidden) return;
      try {
        const detail = await transactionApi.getTransactionById(id!);
        if (mounted) {
          setSelectedTx((prev) => {
            if (prev && prev.status === detail.status && prev.disputeStatus === detail.disputeStatus) {
              return prev;
            }
            return detail;
          });
        }
      } catch {
        // Ignore silent sync error
      }
    };

    const handleTxSocketUpdate = (payload: any) => {
      const updatedId = (payload?.transactionId || payload?.id || '').toString();
      if (!updatedId || updatedId === id) {
        refreshActiveTx();
      }
    };

    socketService.on('transaction_updated', handleTxSocketUpdate);
    const syncTimer = setInterval(refreshActiveTx, 5000);
    window.addEventListener('focus', refreshActiveTx);

    return () => {
      mounted = false;
      clearInterval(syncTimer);
      window.removeEventListener('focus', refreshActiveTx);
      socketService.off('transaction_updated', handleTxSocketUpdate);
    };
  }, [id, transactions]);

  // Live 1s timer for Safeful Time 6h
  useEffect(() => {
    if (!selectedTx || selectedTx.status !== 'in_safeful_time') return;
    const update = () => {
      setCountdown(formatTimeRemaining(selectedTx.safefulTimeExpiresAt));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedTx?.status, selectedTx?.safefulTimeExpiresAt]);

  if (!currentUser) {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 480, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={60}
            dialogue="Đăng nhập để theo dõi tiến trình Ký quỹ 2 chiều và mã PIN trao tay nhé!"
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>
            Quản lý Giao dịch Double Escrow
          </h2>
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

  const filteredList = transactions.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const isBuyer = selectedTx ? selectedTx.buyerId === currentUser.id : false;
  const isSeller = selectedTx ? selectedTx.sellerId === currentUser.id : false;

  const extractPinFromQrPayload = (raw: string): string => {
    const clean = raw.trim().toUpperCase();
    const match = clean.match(/CODE:([A-Z0-9]{6})/);
    if (match && match[1]) return match[1];
    if (/^[A-Z0-9]{6}$/.test(clean)) return clean;
    return '';
  };

  const handleDecodeQrPayload = (raw: string) => {
    setQrPayloadInput(raw);
    const extracted = extractPinFromQrPayload(raw);
    if (extracted) {
      setPinInput(extracted);
      showToast({
        title: 'Đã giải mã QR Bàn Giao!',
        message: `Đã tự động điền mã PIN 6 ký tự: ${extracted}`,
        type: 'success',
      });
    }
  };

  const handleScanQrImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        const bitmap = await createImageBitmap(file);
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        const codes = await detector.detect(bitmap);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          handleDecodeQrPayload(codes[0].rawValue);
          return;
        }
      }
      setErrorMsg('Trình duyệt không nhận diện được ảnh QR này. Vui lòng dán chuỗi QR hoặc nhập mã PIN 6 ký tự.');
    } catch {
      setErrorMsg('Không thể đọc ảnh QR. Hãy dán chuỗi QR hoặc nhập trực tiếp 6 ký tự PIN.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedTx) return;
    setErrorMsg('');
    setActionLoading(true);
    try {
      await transactionApi.cancelTransaction(selectedTx.id, cancelReason);
      const updated = await transactionApi.getTransactionById(selectedTx.id);
      setSelectedTx(updated);
      setShowCancelBox(false);
      await Promise.all([refreshTransactions(), refreshUser(), refreshProducts()]);
      showToast({
        title: 'Đã hủy giao dịch & Hoàn 100% Xu!',
        message: 'Số Xu bảo chứng đã hoàn về ví người mua và món đồ đã mở lại trên chợ.',
        type: 'info',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể hủy giao dịch lúc này.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    if (!pinInput.trim() || pinInput.trim().length < 6) {
      setErrorMsg('Vui lòng nhập đủ mã PIN 6 ký tự từ người mua.');
      return;
    }
    setErrorMsg('');
    setActionLoading(true);
    try {
      await transactionApi.confirmHandover(selectedTx.id, pinInput.trim().toUpperCase());
      const updated = await transactionApi.getTransactionById(selectedTx.id);
      setSelectedTx(updated);
      await Promise.all([refreshTransactions(), refreshUser(), refreshProducts()]);
      showToast({
        title: 'Xác nhận trao tay thành công!',
        message: 'Đã kích hoạt 6 giờ Safeful Time để người mua kiểm tra đồ.',
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error || 'Mã PIN bàn giao không chính xác. Vui lòng kiểm tra lại.'
      );
      const updated = await transactionApi.getTransactionById(selectedTx.id).catch(() => null);
      if (updated) setSelectedTx(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!selectedTx) return;
    setErrorMsg('');
    setActionLoading(true);
    try {
      await transactionApi.completeTransaction(selectedTx.id);
      const updated = await transactionApi.getTransactionById(selectedTx.id);
      setSelectedTx(updated);
      await Promise.all([refreshTransactions(), refreshUser(), refreshProducts()]);
      showToast({
        title: 'Giao dịch hoàn tất!',
        message: 'Đã giải ngân Xu cho người bán và hoàn cọc Safe Fee. Mẹ được cộng +1 Điểm Văn Minh!',
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể hoàn tất giao dịch lúc này.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDisputeEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingEvidence(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3 - disputeImages.length); i++) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(files[i]);
        });
        const url = await uploadApi.uploadBase64Image(base64, 'kindr/disputes');
        urls.push(url);
      }
      setDisputeImages((prev) => [...prev, ...urls].slice(0, 3));
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      setErrorMsg('Vui lòng mô tả rõ lý do khiếu nại (tối thiểu 10 ký tự).');
      return;
    }
    setErrorMsg('');
    setActionLoading(true);
    try {
      await transactionApi.fileDispute(selectedTx.id, disputeReason.trim(), disputeImages);
      const updated = await transactionApi.getTransactionById(selectedTx.id);
      setSelectedTx(updated);
      setShowDisputeForm(false);
      await Promise.all([refreshTransactions(), refreshUser()]);
      showToast({
        title: 'Đã gửi khiếu nại!',
        message: 'Hệ thống đã đóng băng khoản Xu ký quỹ và chuyển cho Admin phân xử.',
        type: 'warning',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể gửi khiếu nại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await ratingApi.submitRating({
        transactionId: selectedTx.id,
        stars,
        comment:
          ratingComment.trim() ||
          selectedTags.join('. ') ||
          'Giao dịch văn minh, đúng hẹn!',
        tags: selectedTags,
      });
      setRatingSubmitted(true);
      const updated = await transactionApi.getTransactionById(selectedTx.id);
      setSelectedTx(updated);
      await Promise.all([refreshTransactions(), refreshUser()]);
      showToast({
        title: 'Cảm ơn mẹ đã đánh giá!',
        message: 'Điểm uy tín và Điểm Văn Minh của đối tác đã được cập nhật.',
        type: 'success',
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Không thể gửi đánh giá.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCounterpartyChat = async () => {
    if (!selectedTx) return;
    try {
      const chat = await chatApi.createChat(selectedTx.productId, selectedTx.sellerId);
      navigate(`/chat/${chat.id}`);
    } catch {
      navigate('/chat');
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'awaiting_handover':
        return <span className="kw-badge kw-badge-warning">Chờ gặp mặt & Nhập PIN</span>;
      case 'in_safeful_time':
        return <span className="kw-badge kw-badge-secondary">Đang kiểm đồ 6h (Safeful Time)</span>;
      case 'disputed':
        return <span className="kw-badge kw-badge-error">Đang khiếu nại (Đóng băng Xu)</span>;
      case 'completed':
        return <span className="kw-badge kw-badge-success">Hoàn tất & Đã giải ngân</span>;
      case 'refunded':
        return <span className="kw-badge kw-badge-muted">Đã hoàn Xu cho người mua</span>;
      default:
        return <span className="kw-badge kw-badge-muted">{status}</span>;
    }
  };

  const currentStepIndex = !selectedTx
    ? 0
    : selectedTx.status === 'awaiting_handover'
    ? 1
    : selectedTx.status === 'in_safeful_time'
    ? 2
    : 3;

  const canRate =
    selectedTx &&
    selectedTx.status === 'completed' &&
    !ratingSubmitted &&
    ((isBuyer && !selectedTx.buyerRated) || (isSeller && !selectedTx.sellerRated));

  return (
    <div className="kw-container" style={{ padding: '28px 16px 64px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
            Trung tâm Giao dịch Double Escrow
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Ký quỹ 2 chiều • Xác thực trao tay bằng mã PIN 6 ký tự • Bảo vệ 6 giờ kiểm đồ Safeful Time
          </p>
        </div>
        <button
          type="button"
          className="kw-btn kw-btn-outline kw-btn-sm"
          onClick={() => refreshTransactions()}
        >
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* FILTER PILLS */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { id: 'all', label: `Tất cả (${transactions.length})` },
          { id: 'awaiting_handover', label: 'Chờ gặp mặt' },
          { id: 'in_safeful_time', label: 'Đang kiểm đồ 6h' },
          { id: 'disputed', label: 'Khiếu nại' },
          { id: 'completed', label: 'Hoàn tất' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={
              statusFilter === tab.id ? 'kw-btn kw-btn-primary kw-btn-sm' : 'kw-btn kw-btn-outline kw-btn-sm'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`kw-tx-layout ${id ? 'has-selected-tx' : ''}`}>
        {/* TRANSACTION LIST */}
        <div className="kw-tx-list-pane" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredList.length === 0 ? (
            <div className="kw-card" style={{ padding: 32, textAlign: 'center' }}>
              <ShieldCheck size={36} color="var(--color-secondary)" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 800, fontSize: 16 }}>Chưa có giao dịch nào</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '6px 0 16px' }}>
                Khi mẹ bấm "Đổi ngay" trên một món đồ, giao dịch Double Escrow sẽ hiển thị tại đây.
              </p>
              <button className="kw-btn kw-btn-primary kw-btn-sm" onClick={() => navigate('/')}>
                Khám phá đồ cho bé
              </button>
            </div>
          ) : (
            filteredList.map((tx) => {
              const active = tx.id === id;
              const userRoleLabel = tx.buyerId === currentUser.id ? 'Người nhận đồ' : 'Người đăng đồ';
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="kw-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    border: active
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={tx.productImage}
                      alt={tx.productName}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--color-primary-dark)',
                          }}
                        >
                          {userRoleLabel}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {formatFullDate(tx.createdAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}
                      >
                        {tx.productName}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 8,
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800 }}>
                          <KindrCoin size={16} />
                          <span>{tx.productPrice === 0 ? '0 Xu (Tặng)' : `${tx.productPrice} Xu`}</span>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TRANSACTION DETAIL PANEL */}
        {id && (
          <div className="kw-card" style={{ padding: 24 }}>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="kw-btn kw-btn-outline kw-btn-sm kw-chat-mobile-back"
              style={{ marginBottom: 14, width: 'fit-content' }}
            >
              <ArrowLeft size={16} />
              Danh sách giao dịch
            </button>
            {loadingTx && !selectedTx ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Đang tải chi tiết giao dịch...
              </div>
            ) : !selectedTx ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p>Không tìm thấy thông tin giao dịch này.</p>
                <button
                  className="kw-btn kw-btn-outline kw-btn-sm"
                  onClick={() => navigate('/transactions')}
                >
                  <ArrowLeft size={15} /> Danh sách giao dịch
                </button>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                    paddingBottom: 20,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img
                      src={selectedTx.productImage}
                      alt={selectedTx.productName}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-default)',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {getStatusBadge(selectedTx.status)}
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          Mã GD: #{selectedTx.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                        {selectedTx.productName}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 13 }}>
                        <span>
                          Người bán: <strong>{selectedTx.sellerName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Người mua: <strong>{selectedTx.buyerName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="kw-btn kw-btn-outline kw-btn-sm"
                      onClick={handleOpenCounterpartyChat}
                    >
                      <MessageCircle size={15} />
                      Nhắn tin hẹn gặp
                    </button>
                  </div>
                </div>

                {/* 4-Step Stepper */}
                <div className="kw-escrow-steps">
                  {[
                    { step: 1, title: '1. Ký quỹ 2 chiều' },
                    { step: 2, title: '2. Trao tay PIN/QR' },
                    { step: 3, title: '3. Kiểm đồ 6 giờ' },
                    { step: 4, title: '4. Giải ngân Xu' },
                  ].map((item) => {
                    const done = currentStepIndex >= item.step;
                    return (
                      <div
                        key={item.step}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: done
                            ? 'var(--color-secondary-light)'
                            : 'var(--color-surface-subtle)',
                          border: done
                            ? '1px solid var(--color-secondary)'
                            : '1px solid var(--color-border)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: done ? 'var(--color-secondary-dark)' : 'var(--color-text-secondary)',
                          textAlign: 'center',
                        }}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                </div>

                {errorMsg && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-error-bg)',
                      color: 'var(--color-error)',
                      fontWeight: 600,
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                {/* ESCROW LOCKED SUMMARY */}
                <div
                  className="kw-grid-3"
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-default)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Giá trị món đồ
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 18, marginTop: 4 }}>
                      <KindrCoin size={18} />
                      <span>{selectedTx.productPrice} Xu</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        ({formatXuToVND(selectedTx.productPrice)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Người mua ký quỹ
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4, color: 'var(--color-primary-dark)' }}>
                      <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {selectedTx.buyerEscrowFrozen} Xu
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Người bán cọc Safe Fee (10%)
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4, color: 'var(--color-secondary-dark)' }}>
                      <ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {selectedTx.sellerEscrowFrozen} Xu
                    </div>
                  </div>
                </div>

                {/* STAGE 1: AWAITING HANDOVER (PIN / QR) */}
                {selectedTx.status === 'awaiting_handover' && (
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 'var(--radius-default)',
                      border: '1.5px solid var(--color-primary)',
                      backgroundColor: 'var(--color-primary-light)',
                      marginBottom: 20,
                    }}
                  >
                    {isBuyer ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 24,
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span className="kw-badge kw-badge-primary">Dành cho Người nhận đồ</span>
                          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px' }}>
                            Đưa mã PIN hoặc mã QR này khi gặp Người bán
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            Chỉ đọc mã PIN 6 ký tự này khi mẹ đã trực tiếp cầm món đồ trên tay. Sau khi người bán nhập mã, mẹ vẫn có thêm <strong>6 giờ Safeful Time</strong> tại nhà để kiểm tra kỹ!
                          </p>

                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 12,
                              marginTop: 12,
                              padding: '12px 20px',
                              borderRadius: 'var(--radius-default)',
                              backgroundColor: 'var(--color-card)',
                              border: '2px dashed var(--color-primary)',
                            }}
                          >
                            <KeyRound size={20} color="var(--color-primary)" />
                            <span
                              style={{
                                fontSize: 28,
                                fontWeight: 800,
                                letterSpacing: 6,
                                color: 'var(--color-primary-dark)',
                              }}
                            >
                              {selectedTx.handoverCode || 'KINDR6'}
                            </span>
                            <button
                              type="button"
                              className="kw-btn kw-btn-ghost kw-btn-sm"
                              onClick={() => {
                                navigator.clipboard?.writeText(selectedTx.handoverCode || '');
                                showToast({
                                  title: 'Đã sao chép mã PIN',
                                  message: `Mã bàn giao: ${selectedTx.handoverCode}`,
                                  type: 'info',
                                });
                              }}
                            >
                              <Copy size={15} />
                            </button>
                          </div>

                          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={async () => {
                                setActionLoading(true);
                                setErrorMsg('');
                                try {
                                  await transactionApi.confirmHandover(selectedTx.id);
                                  const updated = await transactionApi.getTransactionById(selectedTx.id);
                                  setSelectedTx(updated);
                                  await Promise.all([refreshTransactions(), refreshUser(), refreshProducts()]);
                                  showToast({
                                    title: 'Đã xác nhận nhận đồ!',
                                    message: '6 giờ Safeful Time kiểm định tại nhà đã bắt đầu đếm ngược.',
                                    type: 'success',
                                  });
                                } catch (err: any) {
                                  setErrorMsg(err?.response?.data?.error || 'Không thể xác nhận bàn giao.');
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="kw-btn kw-btn-primary kw-btn-sm"
                            >
                              <CheckCircle2 size={16} />
                              <span>Tôi đã nhận đồ tận tay — Bắt đầu 6h Kiểm Định</span>
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setShowCancelBox((v) => !v)}
                              className="kw-btn kw-btn-outline kw-btn-sm"
                              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                            >
                              Hủy hẹn & Hoàn 100% Xu
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <QrCodeVisual
                            value={selectedTx.qrCodePayload || `KINDR|TX:${selectedTx.id}|CODE:${selectedTx.handoverCode || 'KINDR6'}`}
                            size={168}
                          />
                          <button
                            type="button"
                            className="kw-btn kw-btn-outline kw-btn-sm"
                            style={{ fontSize: 11, minHeight: 32 }}
                            onClick={() => {
                              const payload =
                                selectedTx.qrCodePayload ||
                                `KINDR|TX:${selectedTx.id}|CODE:${selectedTx.handoverCode || 'KINDR6'}`;
                              navigator.clipboard?.writeText(payload);
                              showToast({
                                title: 'Đã sao chép Chuỗi QR Bàn Giao',
                                message: 'Người bán có thể dán chuỗi QR này vào trình quét để xác thực.',
                                type: 'info',
                              });
                            }}
                          >
                            <Copy size={13} />
                            <span>Sao chép chuỗi QR</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleConfirmHandover}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <span className="kw-badge kw-badge-primary">Dành cho Người bán</span>
                          <button
                            type="button"
                            className="kw-btn kw-btn-outline kw-btn-sm"
                            onClick={() => setShowQrScannerBox((v) => !v)}
                          >
                            <Upload size={14} />
                            <span>{showQrScannerBox ? 'Đóng trình quét QR' : 'Quét ảnh QR / Dán chuỗi QR'}</span>
                          </button>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px' }}>
                          Nhập mã PIN 6 ký tự hoặc Quét QR từ Người mua để xác nhận đã trao tay
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                          Khi gặp mặt giao đồ, hãy hỏi người mua mã PIN 6 ký tự hoặc quét mã QR trên màn hình của họ.
                          Số lần thử còn lại:{' '}
                          <strong>{Math.max(0, 5 - (selectedTx.handoverFailedAttempts || 0))}/5</strong>
                        </p>

                        {showQrScannerBox && (
                          <div
                            style={{
                              padding: 16,
                              borderRadius: 'var(--radius-default)',
                              backgroundColor: 'var(--color-card)',
                              border: '1px dashed var(--color-secondary)',
                              marginBottom: 16,
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
                              Trình giải mã QR Handover Kindr (Hỗ trợ ảnh chụp QR & Chuỗi Payload)
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                              <label className="kw-btn kw-btn-outline kw-btn-sm" style={{ cursor: 'pointer' }}>
                                <Upload size={14} />
                                <span>Tải ảnh chụp mã QR của Người mua</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleScanQrImageFile}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                            <input
                              type="text"
                              className="kw-input"
                              placeholder="Hoặc dán chuỗi QR (VD: KINDR|TX:...|CODE:A8F3K9) vào đây..."
                              value={qrPayloadInput}
                              onChange={(e) => handleDecodeQrPayload(e.target.value)}
                              style={{ fontSize: 13 }}
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 520 }}>
                          <input
                            type="text"
                            maxLength={6}
                            className="kw-input"
                            style={{
                              flex: 1,
                              fontSize: 20,
                              fontWeight: 800,
                              letterSpacing: 6,
                              textTransform: 'uppercase',
                              textAlign: 'center',
                            }}
                            placeholder="VD: A8F3K9"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                          />
                          <button
                            type="submit"
                            className="kw-btn kw-btn-primary"
                            disabled={actionLoading}
                          >
                            <CheckCircle2 size={18} />
                            <span>{actionLoading ? 'Đang xác thực...' : 'Xác nhận trao tay'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => setShowCancelBox((v) => !v)}
                            className="kw-btn kw-btn-outline"
                            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          >
                            Hủy lịch hẹn
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Cancel before handover drawer */}
                    {showCancelBox && (
                      <div
                        style={{
                          marginTop: 18,
                          padding: 16,
                          borderRadius: 'var(--radius-default)',
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-error)',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-error)', marginBottom: 8 }}>
                          Hủy giao dịch trước bàn giao (Hoàn trả 100% Xu bảo chứng cho Người mua)
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          {[
                            'Hai bên chưa sắp xếp được lịch hẹn gặp mặt',
                            'Người mua đổi ý muốn chọn món đồ khác',
                            'Người bán bận đột xuất chưa thể giao đồ',
                          ].map((r) => (
                            <button
                              key={r}
                              type="button"
                              className="kw-btn kw-btn-ghost kw-btn-sm"
                              style={{ fontSize: 12, minHeight: 32 }}
                              onClick={() => setCancelReason(r)}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="kw-input"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Nhập lý do hủy lịch hẹn..."
                          style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleCancelTransaction}
                            className="kw-btn kw-btn-primary kw-btn-sm"
                            style={{ backgroundColor: 'var(--color-error)' }}
                          >
                            Xác nhận Hủy & Hoàn 100% Xu
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelBox(false)}
                            className="kw-btn kw-btn-ghost kw-btn-sm"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STAGE 2: IN SAFEFUL TIME (6H COUNTDOWN) */}
                {selectedTx.status === 'in_safeful_time' && (
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-secondary-light)',
                      border: '1.5px solid var(--color-secondary)',
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock size={20} color="var(--color-secondary-dark)" />
                          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-secondary-dark)' }}>
                            Thời gian bảo vệ kiểm đồ 6 giờ (Safeful Time)
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                          Nếu sau 6 giờ không có khiếu nại, hệ thống tự động giải ngân{' '}
                          <strong>{selectedTx.productPrice} Xu</strong> cho người bán và hoàn cọc Safe Fee.
                        </p>
                      </div>

                      <div
                        style={{
                          padding: '10px 18px',
                          borderRadius: 'var(--radius-default)',
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-secondary)',
                          fontSize: 24,
                          fontWeight: 800,
                          color: 'var(--color-secondary-dark)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {countdown.formatted}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: 8,
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--color-card)',
                        overflow: 'hidden',
                        margin: '16px 0',
                      }}
                    >
                      <div
                        style={{
                          width: `${countdown.progress}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-secondary)',
                          transition: 'width 0.5s linear',
                        }}
                      />
                    </div>

                    {isBuyer && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                        <button
                          type="button"
                          className="kw-btn kw-btn-primary"
                          onClick={handleCompleteEarly}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={18} />
                          <span>Hài lòng — Giải ngân Xu ngay (+1 Điểm Văn Minh)</span>
                        </button>
                        <button
                          type="button"
                          className="kw-btn kw-btn-outline"
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          onClick={() => setShowDisputeForm((v) => !v)}
                        >
                          <AlertTriangle size={17} />
                          <span>Báo cáo sai mô tả / Khiếu nại</span>
                        </button>
                      </div>
                    )}

                    {/* DISPUTE DRAWER */}
                    {isBuyer && showDisputeForm && (
                      <form
                        onSubmit={handleSubmitDispute}
                        style={{
                          marginTop: 20,
                          padding: 20,
                          borderRadius: 'var(--radius-default)',
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-error)',
                        }}
                      >
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-error)', margin: '0 0 12px' }}>
                          Gửi yêu cầu Khiếu nại & Đóng băng Xu ký quỹ
                        </h4>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                          {DISPUTE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className="kw-btn kw-btn-ghost kw-btn-sm"
                              style={{ fontSize: 12, minHeight: 34 }}
                              onClick={() => setDisputeReason(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="kw-textarea"
                          rows={3}
                          placeholder="Mô tả chi tiết điểm không đúng cam kết để Admin Kindr phân xử công bằng..."
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          style={{ marginBottom: 12 }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                          <label className="kw-btn kw-btn-outline kw-btn-sm" style={{ cursor: 'pointer' }}>
                            <Upload size={14} />
                            <span>
                              {uploadingEvidence
                                ? 'Đang tải ảnh...'
                                : `Đính kèm ảnh bằng chứng (${disputeImages.length}/3)`}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleUploadDisputeEvidence}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {disputeImages.map((img, i) => (
                            <img
                              key={img}
                              src={img}
                              alt={`Evidence ${i + 1}`}
                              style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                            />
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="submit"
                            className="kw-btn kw-btn-primary"
                            style={{ backgroundColor: 'var(--color-error)' }}
                            disabled={actionLoading}
                          >
                            Gửi khiếu nại lên Admin
                          </button>
                          <button
                            type="button"
                            className="kw-btn kw-btn-ghost"
                            onClick={() => setShowDisputeForm(false)}
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* STAGE 3: DISPUTED */}
                {selectedTx.status === 'disputed' && (
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-error-bg)',
                      border: '1px solid var(--color-error)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--color-error)', fontSize: 16 }}>
                      <AlertTriangle size={20} />
                      <span>Giao dịch đang bị đóng băng để Admin phân xử</span>
                    </div>
                    <p style={{ fontSize: 13, margin: '8px 0 0' }}>
                      <strong>Lý do khiếu nại:</strong> {selectedTx.disputeReason || 'Sai lệch so với mô tả'}
                    </p>
                    {selectedTx.disputeEvidenceImages && selectedTx.disputeEvidenceImages.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {selectedTx.disputeEvidenceImages.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Bằng chứng"
                            style={{ width: 88, height: 88, borderRadius: 8, objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STAGE 4: COMPLETED & RATING */}
                {(selectedTx.status === 'completed' || selectedTx.status === 'refunded') && (
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-success-bg)',
                      border: '1px solid var(--color-success)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--color-success)', fontSize: 16 }}>
                      <CheckCircle2 size={20} />
                      <span>
                        {selectedTx.status === 'completed'
                          ? 'Giao dịch đã hoàn tất & giải ngân Xu thành công!'
                          : 'Giao dịch đã được hoàn Xu về ví người mua'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                      Cả hai mẹ đều được cộng Điểm Văn Minh khi giao dịch minh bạch trên Kindr.
                    </p>
                  </div>
                )}

                {/* 5-STAR RATING FORM */}
                {canRate && (
                  <form
                    onSubmit={handleSubmitRating}
                    style={{
                      padding: 24,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>
                      Đánh giá độ văn minh của {isBuyer ? selectedTx.sellerName : selectedTx.buyerName}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      Đánh giá 4–5 sao giúp đối tác được cộng thêm +2 Điểm Văn Minh!
                    </p>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setStars(num)}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            border: '1px solid var(--color-border)',
                            backgroundColor:
                              num <= stars ? 'var(--color-warning-bg)' : 'var(--color-card)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Star
                            size={22}
                            color="var(--color-coin-gold)"
                            fill={num <= stars ? 'var(--color-coin-gold)' : 'none'}
                          />
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      {RATING_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedTags((prev) =>
                                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                              )
                            }
                            className={
                              active
                                ? 'kw-btn kw-btn-primary kw-btn-sm'
                                : 'kw-btn kw-btn-outline kw-btn-sm'
                            }
                            style={{ minHeight: 34, fontSize: 12 }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      className="kw-textarea"
                      rows={2}
                      placeholder="Gửi lời cảm ơn ấm áp đến mẹ bỉm đối tác..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />

                    <button
                      type="submit"
                      className="kw-btn kw-btn-primary"
                      disabled={actionLoading}
                    >
                      Gửi đánh giá {stars} Sao
                    </button>
                  </form>
                )}

                {/* Counterparty Masked Contact Info */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={15} color="var(--color-secondary-dark)" />
                    <span>
                      SĐT bảo mật đối tác:{' '}
                      <strong>
                        {maskPhoneNumber(isBuyer ? selectedTx.sellerPhone : selectedTx.buyerPhone)}
                      </strong>
                    </span>
                  </div>
                  <span>Tạo lúc: {formatFullDate(selectedTx.createdAt)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
