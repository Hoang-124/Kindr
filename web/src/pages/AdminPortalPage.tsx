// d:\Kindr\web\src\pages\AdminPortalPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  PackageCheck,
  Landmark,
  Users,
  Receipt,
  Flag,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Trash2,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { adminApi } from '../services/domainServices';
import {
  User,
  Product,
  Transaction,
  WithdrawRequestItem,
  ReportItem,
  CategoryItem,
  WaitlistEntry,
} from '../types';
import {
  formatFullDate,
  formatNumber,
  getProductStatusBadge,
  getTransactionStatusBadge,
  getWithdrawStatusBadge,
} from '../utils/pricing';
import { KindrCoin, MascotIcon } from '../components/KindrCoin';

type AdminTab =
  | 'overview'
  | 'disputes'
  | 'products'
  | 'withdraws'
  | 'users'
  | 'transactions'
  | 'reports'
  | 'waitlist';

export const AdminPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showToast, refreshProducts, refreshUser, requestConfirm } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    pendingProducts: 0,
    pendingDisputes: 0,
    pendingWithdraws: 0,
    openReports: 0,
    escrowLockedXu: 0,
  });

  const [disputes, setDisputes] = useState<Transaction[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequestItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [surveySummary, setSurveySummary] = useState({
    total: 0,
    hasItemsToDeclutter: 0,
    fearsFacebookScams: 0,
    findsAppUseful: 0,
    willingToRefer: 0,
    saveMoney: 0,
    declutter: 0,
    newItems: 0,
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  const loadAdminData = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setLoading(true);
    try {
      const [
        dashData,
        disputesList,
        prodsList,
        withdrawsList,
        usersList,
        txList,
        reportsList,
        catsList,
        waitlistData,
        surveyData,
      ] = await Promise.all([
        adminApi.getDashboard().catch(() => stats),
        adminApi.getDisputes().catch(() => []),
        adminApi.getProducts().catch(() => []),
        adminApi.getWithdraws('all').catch(() => []),
        adminApi.getUsers().catch(() => []),
        adminApi.getTransactions().catch(() => []),
        adminApi.getReports().catch(() => []),
        adminApi.getCategories().catch(() => []),
        adminApi.getWaitlistEntries().catch(() => ({ entries: [], total: 0 })),
        adminApi.getSurveySummary().catch(() => surveySummary),
      ]);

      setStats(dashData);
      setDisputes(disputesList);
      setAdminProducts(prodsList);
      setWithdraws(withdrawsList);
      setUsers(usersList);
      setAllTransactions(txList);
      setReports(reportsList);
      setCategories(catsList);
      setWaitlist(waitlistData.entries);
      setSurveySummary(surveyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [currentUser?.id, currentUser?.role]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="kw-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="kw-card" style={{ maxWidth: 500, margin: '0 auto', padding: 32 }}>
          <MascotIcon
            size={60}
            dialogue="Khu vực này dành riêng cho Quản trị viên hệ thống Kindr (Admin)."
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>
            Yêu cầu quyền Quản trị viên (Admin)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '8px 0 20px' }}>
            Hãy đăng nhập bằng tài khoản Admin (`0900000000` / `123456`) để truy cập trung tâm điều hành.
          </p>
          <button className="kw-btn kw-btn-primary" onClick={() => navigate('/login')}>
            Đến trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const handleResolveDispute = (
    txId: string,
    outcome: 'resolved_buyer' | 'resolved_seller'
  ) => {
    const isBuyerWin = outcome === 'resolved_buyer';
    requestConfirm({
      title: isBuyerWin
        ? 'Phán quyết: Người Mua Thắng (Hoàn 100% Xu)?'
        : 'Phán quyết: Người Bán Thắng (Giải ngân Xu)?',
      message: isBuyerWin
        ? 'Hệ thống sẽ hoàn trả 100% Xu cho Người Mua, tịch thu cọc Safe Fee và trừ -25 Điểm Văn Minh của Người Bán. Thao tác không thể hoàn tác.'
        : 'Hệ thống sẽ giải ngân Xu + hoàn cọc Safe Fee cho Người Bán, đồng thời trừ -25 Điểm Văn Minh của Người Mua do khiếu nại sai. Thao tác không thể hoàn tác.',
      confirmText: isBuyerWin ? 'Xác nhận: Người Mua Thắng' : 'Xác nhận: Người Bán Thắng',
      cancelText: 'Xem xét lại',
      variant: isBuyerWin ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await adminApi.resolveDispute(txId, outcome);
          showToast({
            title: 'Đã phân xử tranh chấp thành công!',
            message: isBuyerWin
              ? 'Đã hoàn Xu cho người mua & tịch thu cọc Safe Fee của người bán.'
              : 'Đã giải ngân Xu cho người bán & trừ điểm văn minh người khiếu nại sai.',
            type: 'success',
          });
          await Promise.all([loadAdminData(), refreshProducts(), refreshUser()]);
        } catch (err: any) {
          showToast({
            title: 'Lỗi phân xử',
            message: err?.response?.data?.error || 'Không thể xử lý tranh chấp.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      await adminApi.approveProduct(productId);
      showToast({
        title: 'Đã duyệt bài đăng!',
        message: 'Sản phẩm đã hiển thị công khai trên sàn.',
        type: 'success',
      });
      await Promise.all([loadAdminData(), refreshProducts()]);
    } catch {
      // Ignore
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const prod = adminProducts.find((p) => p.id === productId);
    requestConfirm({
      title: 'Gỡ bài đăng khỏi hệ thống?',
      message: `Xác nhận gỡ bài đăng "${prod?.name || productId}" và hoàn trả cọc Safe Fee (nếu có) cho người bán?`,
      confirmText: 'Xác nhận gỡ bài',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await adminApi.removeProduct(productId);
          showToast({
            title: 'Đã gỡ bài đăng',
            message: 'Sản phẩm đã được gỡ và hoàn cọc Safe Fee (nếu có).',
            type: 'info',
          });
          await Promise.all([loadAdminData(), refreshProducts()]);
        } catch {
          // Ignore
        }
      },
    });
  };

  const handleWithdrawAction = (
    id: string,
    action: 'approve' | 'reject'
  ) => {
    const w = withdraws.find((item) => item.id === id);
    const isApprove = action === 'approve';
    requestConfirm({
      title: isApprove
        ? 'Xác nhận đã chuyển khoản ngân hàng?'
        : 'Từ chối lệnh rút tiền & Hoàn Xu?',
      message: isApprove
        ? `Xác nhận đã chuyển khoản ${formatNumber(w?.payoutVnd || 0)}đ tới TK ${w?.bankName || ''} • ${w?.accountNumber || ''} (${w?.accountHolder || ''})?`
        : `Từ chối lệnh rút ${w?.xuAmount || 0} Xu của ${w?.userName || 'thành viên'} và hoàn lại 100% số Xu về ví của họ?`,
      confirmText: isApprove ? 'Đã chuyển khoản' : 'Từ chối & Hoàn Xu',
      cancelText: 'Hủy bỏ',
      variant: isApprove ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          if (isApprove) {
            await adminApi.approveWithdraw(id);
          } else {
            await adminApi.rejectWithdraw(id, 'Thông tin tài khoản ngân hàng chưa khớp');
          }
          showToast({
            title: isApprove ? 'Đã duyệt chuyển khoản!' : 'Đã từ chối & hoàn Xu',
            message: 'Trạng thái lệnh rút tiền đã được cập nhật.',
            type: 'success',
          });
          await loadAdminData();
        } catch {
          // Ignore
        }
      },
    });
  };

  const handleToggleUserLock = (u: User) => {
    requestConfirm({
      title: u.isLocked ? `Mở khóa tài khoản ${u.name}?` : `Khóa tài khoản ${u.name}?`,
      message: u.isLocked
        ? `Cho phép thành viên "${u.name}" đăng nhập và giao dịch trở lại trên hệ thống Kindr?`
        : `Tạm khóa tài khoản "${u.name}"? Thành viên này sẽ không thể đăng đồ hoặc tạo giao dịch mới cho tới khi được mở khóa.`,
      confirmText: u.isLocked ? 'Mở khóa ngay' : 'Khóa tài khoản',
      cancelText: 'Hủy bỏ',
      variant: u.isLocked ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          if (u.isLocked) {
            await adminApi.unlockUser(u.id);
          } else {
            await adminApi.lockUser(u.id);
          }
          showToast({
            title: u.isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
            message: `Thành viên: ${u.name}`,
            type: 'info',
          });
          await loadAdminData();
        } catch {
          // Ignore
        }
      },
    });
  };

  const handleToggleUserRole = (u: User) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    requestConfirm({
      title:
        nextRole === 'admin'
          ? `Cấp quyền Quản trị viên (Admin) cho ${u.name}?`
          : `Thu hồi quyền Admin của ${u.name}?`,
      message:
        nextRole === 'admin'
          ? `Thành viên "${u.name}" sẽ có toàn quyền truy cập Trung tâm Điều hành Admin (phân xử khiếu nại, duyệt rút tiền, kiểm duyệt bài đăng).`
          : `Chuyển tài khoản "${u.name}" về vai trò Thành viên thông thường (User)?`,
      confirmText: nextRole === 'admin' ? 'Cấp quyền Admin' : 'Hạ xuống User',
      cancelText: 'Hủy bỏ',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await adminApi.updateUserRole(u.id, nextRole);
          showToast({
            title: nextRole === 'admin' ? 'Đã cấp quyền Admin' : 'Đã thu hồi quyền Admin',
            message: `Thành viên: ${u.name}`,
            type: 'success',
          });
          await loadAdminData();
        } catch {
          // Ignore
        }
      },
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatCode.trim()) return;
    try {
      await adminApi.createCategory(newCatName.trim(), newCatCode.trim());
      setNewCatName('');
      setNewCatCode('');
      await loadAdminData();
      showToast({
        title: 'Đã thêm danh mục mới',
        message: newCatName.trim(),
        type: 'success',
      });
    } catch {
      // Ignore
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Tổng quan KPI', icon: <LayoutDashboard size={17} /> },
    {
      id: 'disputes',
      label: 'Phân xử Khiếu nại',
      icon: <Scale size={17} />,
      badge: stats.pendingDisputes,
    },
    {
      id: 'products',
      label: 'Kiểm duyệt Bài đăng',
      icon: <PackageCheck size={17} />,
      badge: stats.pendingProducts,
    },
    {
      id: 'withdraws',
      label: 'Duyệt Rút tiền NH',
      icon: <Landmark size={17} />,
      badge: stats.pendingWithdraws,
    },
    { id: 'users', label: 'Quản lý Thành viên', icon: <Users size={17} /> },
    { id: 'transactions', label: 'Sổ cái Double Escrow', icon: <Receipt size={17} /> },
    {
      id: 'reports',
      label: 'Báo cáo & Danh mục',
      icon: <Flag size={17} />,
      badge: stats.openReports,
    },
    {
      id: 'waitlist',
      label: 'Waitlist 200 Founding',
      icon: <Sparkles size={17} />,
      badge: waitlist.length,
    },
  ];

  return (
    <div className="kw-container" style={{ padding: '24px 16px 64px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <span className="kw-badge kw-badge-primary">Kindr Trust & Safety Backoffice</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 0' }}>
            Trung tâm Điều hành Quản trị viên
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="kw-btn kw-btn-outline kw-btn-sm"
            onClick={() => navigate('/profile')}
          >
            <Users size={15} />
            <span>Hồ sơ cá nhân</span>
          </button>
          <button
            type="button"
            className="kw-btn kw-btn-outline kw-btn-sm"
            onClick={loadAdminData}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>{loading ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}</span>
          </button>
        </div>
      </div>

      <div className="kw-admin-layout">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div
          className="kw-card kw-admin-sidebar-nav"
          style={{
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            position: 'sticky',
            top: 84,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: active
                    ? 'var(--color-primary)'
                    : 'transparent',
                  color: active ? 'var(--color-text-white)' : 'var(--color-text)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: active
                        ? 'var(--color-card)'
                        : 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN ADMIN CONTENT */}
        <div>
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="kw-grid-4">
                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Tổng Thành viên
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                    {stats.totalUsers}
                  </div>
                </div>

                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Tổng Bài đăng
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                    {stats.totalProducts}
                  </div>
                </div>

                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Giao dịch Double Escrow
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                    {stats.totalTransactions}
                  </div>
                </div>

                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Xu đang khóa Escrow
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 28, fontWeight: 800, marginTop: 6, color: 'var(--color-coin-text)' }}>
                    <KindrCoin size={24} />
                    <span>{stats.escrowLockedXu} Xu</span>
                  </div>
                </div>
              </div>

              <div className="kw-grid-3">
                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Khiếu nại chờ phân xử</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-error)', margin: '8px 0' }}>
                    {stats.pendingDisputes}
                  </div>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline kw-btn-sm"
                    onClick={() => setActiveTab('disputes')}
                  >
                    Xử lý ngay
                  </button>
                </div>

                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Lệnh rút tiền chờ duyệt</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-warning)', margin: '8px 0' }}>
                    {stats.pendingWithdraws}
                  </div>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline kw-btn-sm"
                    onClick={() => setActiveTab('withdraws')}
                  >
                    Kiểm tra lệnh rút
                  </button>
                </div>

                <div className="kw-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Bài đăng chờ duyệt</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-secondary-dark)', margin: '8px 0' }}>
                    {stats.pendingProducts}
                  </div>
                  <button
                    type="button"
                    className="kw-btn kw-btn-outline kw-btn-sm"
                    onClick={() => setActiveTab('products')}
                  >
                    Duyệt bài đăng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="kw-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
                Phân xử Tranh chấp Double Escrow ({disputes.length})
              </h3>
              {disputes.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Tuyệt vời! Hiện không có khiếu nại nào cần phân xử.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {disputes.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: 20,
                        borderRadius: 'var(--radius-default)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <span className="kw-badge kw-badge-error">Đang tranh chấp</span>
                          <h4 style={{ fontSize: 17, fontWeight: 800, margin: '8px 0 4px' }}>
                            {tx.productName} ({tx.productPrice} Xu + Cọc {tx.sellerEscrowFrozen} Xu)
                          </h4>
                          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            Người mua: <strong>{tx.buyerName}</strong> • Người bán:{' '}
                            <strong>{tx.sellerName}</strong>
                          </div>
                          <p style={{ fontSize: 13, marginTop: 8 }}>
                            <strong>Lý do khiếu nại:</strong> {tx.disputeReason || 'Không đúng mô tả'}
                          </p>
                          {tx.disputeEvidenceImages && tx.disputeEvidenceImages.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                              {tx.disputeEvidenceImages.map((imgUrl, idx) => (
                                <a key={idx} href={imgUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={imgUrl}
                                    alt={`Bằng chứng ${idx + 1}`}
                                    referrerPolicy="no-referrer"
                                    style={{
                                      width: 68,
                                      height: 68,
                                      objectFit: 'cover',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--color-border-strong)',
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="kw-btn kw-btn-outline kw-btn-sm"
                            onClick={() => navigate(`/transactions/${tx.id}`)}
                          >
                            Xem đơn hàng
                          </button>
                          {tx.status === 'disputed' && (
                            <>
                              <button
                                type="button"
                                className="kw-btn kw-btn-primary kw-btn-sm"
                                onClick={() => handleResolveDispute(tx.id, 'resolved_buyer')}
                              >
                                <CheckCircle2 size={15} />
                                <span>Hoàn Xu Người mua (Phạt cọc Người bán)</span>
                              </button>
                              <button
                                type="button"
                                className="kw-btn kw-btn-secondary kw-btn-sm"
                                onClick={() => handleResolveDispute(tx.id, 'resolved_seller')}
                              >
                                <CheckCircle2 size={15} />
                                <span>Giải ngân Người bán (Bác bỏ khiếu nại)</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. PRODUCTS MODERATION */}
          {activeTab === 'products' && (
            <div className="kw-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
                Quản lý & Kiểm duyệt Bài đăng ({adminProducts.length})
              </h3>
              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Người đăng</th>
                      <th>Giá Xu</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                {p.locationName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{p.sellerName}</td>
                        <td>
                          <strong>{p.price} Xu</strong>
                        </td>
                        <td>
                          <span className={`kw-badge ${getProductStatusBadge(p.status).className}`}>
                            {getProductStatusBadge(p.status).label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {p.status === 'pending_approval' && (
                              <button
                                type="button"
                                className="kw-btn kw-btn-primary kw-btn-sm"
                                onClick={() => handleApproveProduct(p.id)}
                              >
                                Duyệt
                              </button>
                            )}
                            {p.status !== 'removed' && (
                              <button
                                type="button"
                                className="kw-btn kw-btn-ghost kw-btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                onClick={() => handleRemoveProduct(p.id)}
                              >
                                <Trash2 size={14} /> Gỡ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. WITHDRAWS */}
          {activeTab === 'withdraws' && (
            <div className="kw-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
                Duyệt Lệnh Rút tiền Ngân hàng ({withdraws.length})
              </h3>
              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Người yêu cầu</th>
                      <th>Số Xu</th>
                      <th>Thực nhận (90%)</th>
                      <th>Ngân hàng</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdraws.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <strong>{w.userName}</strong>
                        </td>
                        <td>{w.xuAmount} Xu</td>
                        <td>
                          <strong style={{ color: 'var(--color-success)' }}>
                            {formatNumber(w.payoutVnd)}đ
                          </strong>
                        </td>
                        <td>
                          {w.bankName} • {w.accountNumber} ({w.accountHolder})
                        </td>
                        <td>
                          <span className={`kw-badge ${getWithdrawStatusBadge(w.status).className}`}>
                            {getWithdrawStatusBadge(w.status).label}
                          </span>
                        </td>
                        <td>
                          {w.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="kw-btn kw-btn-primary kw-btn-sm"
                                onClick={() => handleWithdrawAction(w.id, 'approve')}
                              >
                                <CheckCircle2 size={14} /> Duyệt CK
                              </button>
                              <button
                                type="button"
                                className="kw-btn kw-btn-outline kw-btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                onClick={() => handleWithdrawAction(w.id, 'reject')}
                              >
                                <XCircle size={14} /> Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. USERS */}
          {activeTab === 'users' && (
            <div className="kw-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  Quản lý Thành viên ({filteredUsers.length})
                </h3>
                <input
                  type="text"
                  className="kw-input"
                  style={{ maxWidth: 280 }}
                  placeholder="Tìm tên, SĐT, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>SĐT / Email</th>
                      <th>Số dư Xu</th>
                      <th>Điểm Văn Minh</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          {u.role === 'admin' && (
                            <span className="kw-badge kw-badge-primary" style={{ marginLeft: 6 }}>
                              Admin
                            </span>
                          )}
                        </td>
                        <td>{u.phone || u.email}</td>
                        <td>
                          {u.xuBalance} Xu (Khóa: {u.xuFrozen})
                        </td>
                        <td>
                          <strong>{u.civilizationPoints}/100</strong>
                        </td>
                        <td>
                          {u.isLocked ? (
                            <span className="kw-badge kw-badge-error">Đã khóa</span>
                          ) : (
                            <span className="kw-badge kw-badge-success">Hoạt động</span>
                          )}
                        </td>
                        <td>
                          {u.id !== currentUser.id && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="kw-btn kw-btn-outline kw-btn-sm"
                                onClick={() => handleToggleUserLock(u)}
                              >
                                {u.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                <span>{u.isLocked ? 'Mở khóa' : 'Khóa TK'}</span>
                              </button>
                              <button
                                type="button"
                                className="kw-btn kw-btn-ghost kw-btn-sm"
                                onClick={() => handleToggleUserRole(u)}
                              >
                                <span>{u.role === 'admin' ? 'Hạ User' : 'Cấp Admin'}</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="kw-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
                Sổ cái Giao dịch Double Escrow ({allTransactions.length})
              </h3>
              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Mã GD</th>
                      <th>Sản phẩm</th>
                      <th>Người mua → Người bán</th>
                      <th>Ký quỹ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>#{tx.id.slice(-6).toUpperCase()}</td>
                        <td>
                          <strong>{tx.productName}</strong>
                        </td>
                        <td>
                          {tx.buyerName} → {tx.sellerName}
                        </td>
                        <td>
                          Mua: {tx.buyerEscrowFrozen} Xu • Cọc: {tx.sellerEscrowFrozen} Xu
                        </td>
                        <td>
                          <span className={`kw-badge ${getTransactionStatusBadge(tx.status).className}`}>
                            {getTransactionStatusBadge(tx.status).label}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="kw-btn kw-btn-outline kw-btn-sm"
                            onClick={() => navigate(`/transactions/${tx.id}`)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. REPORTS & CATEGORIES */}
          {activeTab === 'reports' && (
            <div className="kw-grid-2">
              <div className="kw-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>
                  Báo cáo vi phạm ({reports.length})
                </h3>
                {reports.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Không có báo cáo vi phạm nào.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reports.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          padding: 12,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-subtle)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          [{r.targetType === 'product' ? 'Bài đăng' : 'Tài khoản'}] {r.reason}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '4px 0 8px' }}>
                          Người báo cáo: {r.reporterName} • Trạng thái:{' '}
                          <strong>{r.status === 'open' ? 'Chờ xử lý' : r.status === 'reviewed' ? 'Đã xử lý' : 'Đã bỏ qua'}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {r.targetType === 'product' && (
                            <button
                              type="button"
                              className="kw-btn kw-btn-outline kw-btn-sm"
                              onClick={() => navigate(`/products/${r.targetId}`)}
                            >
                              Mở bài đăng
                            </button>
                          )}
                          {r.status === 'open' && (
                            <>
                              <button
                                type="button"
                                className="kw-btn kw-btn-primary kw-btn-sm"
                                onClick={async () => {
                                  try {
                                    await adminApi.updateReport(r.id, 'reviewed');
                                    showToast({
                                      title: 'Đã xử lý báo cáo',
                                      message: 'Trạng thái báo cáo đã được chuyển sang Đã xử lý.',
                                      type: 'success',
                                    });
                                    loadAdminData();
                                  } catch (err: any) {
                                    showToast({
                                      title: 'Lỗi cập nhật',
                                      message: err?.response?.data?.error || 'Không thể cập nhật báo cáo.',
                                      type: 'error',
                                    });
                                  }
                                }}
                              >
                                Đã xử lý
                              </button>
                              <button
                                type="button"
                                className="kw-btn kw-btn-ghost kw-btn-sm"
                                onClick={async () => {
                                  try {
                                    await adminApi.updateReport(r.id, 'dismissed');
                                    showToast({
                                      title: 'Đã bỏ qua báo cáo',
                                      message: 'Báo cáo đã được đóng.',
                                      type: 'info',
                                    });
                                    loadAdminData();
                                  } catch (err: any) {
                                    showToast({
                                      title: 'Lỗi cập nhật',
                                      message: err?.response?.data?.error || 'Không thể cập nhật báo cáo.',
                                      type: 'error',
                                    });
                                  }
                                }}
                              >
                                Bỏ qua
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="kw-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>
                  Danh mục Sản phẩm ({categories.length})
                </h3>
                <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input
                    type="text"
                    className="kw-input"
                    placeholder="Tên danh mục..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="kw-input"
                    placeholder="Mã code..."
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                  />
                  <button type="submit" className="kw-btn kw-btn-primary kw-btn-sm">
                    <Plus size={15} />
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        <strong>{c.name}</strong> ({c.code})
                      </span>
                      <button
                        type="button"
                        className="kw-btn kw-btn-ghost kw-btn-sm"
                        onClick={() => {
                          requestConfirm({
                            title: `Xóa danh mục "${c.name}"?`,
                            message: `Xác nhận xóa danh mục "${c.name}" (${c.code}) khỏi hệ thống?`,
                            confirmText: 'Xóa danh mục',
                            cancelText: 'Giữ lại',
                            variant: 'danger',
                            onConfirm: async () => {
                              try {
                                await adminApi.deleteCategory(c.id);
                                showToast({
                                  title: 'Đã xóa danh mục',
                                  message: `Đã xóa danh mục "${c.name}".`,
                                  type: 'info',
                                });
                                loadAdminData();
                              } catch (err: any) {
                                showToast({
                                  title: 'Không thể xóa danh mục',
                                  message:
                                    err?.response?.data?.error ||
                                    'Danh mục này đang có sản phẩm hoặc không thể xóa.',
                                  type: 'error',
                                });
                              }
                            },
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. WAITLIST 200 FOUNDING MEMBERS & SURVEY SUMMARY */}
          {activeTab === 'waitlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="kw-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>
                  Thống kê Khảo sát Pop-up 5 Câu ({surveySummary.total} phản hồi)
                </h3>
                <div className="kw-grid-4">
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Có đồ cần dọn (Câu 1)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                      {surveySummary.hasItemsToDeclutter}/{surveySummary.total}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Ngại mặc cả/scam FB (Câu 3)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-warning)', marginTop: 4 }}>
                      {surveySummary.fearsFacebookScams}/{surveySummary.total}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Thấy App 6h hữu ích (Câu 4)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-secondary-dark)', marginTop: 4 }}>
                      {surveySummary.findsAppUseful}/{surveySummary.total}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-default)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Sẵn lòng giới thiệu (Câu 5)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                      {surveySummary.willingToRefer}/{surveySummary.total}
                    </div>
                  </div>
                </div>
              </div>

              <div className="kw-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
                  Danh sách 200 Founding Members Waitlist ({waitlist.length})
                </h3>
              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Hạng thẻ</th>
                      <th>Thưởng +5 Xu</th>
                      <th>Ngày đăng ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <strong>#{w.orderNumber}</strong>
                        </td>
                        <td>{w.email}</td>
                        <td>{w.phone || '—'}</td>
                        <td>
                          {w.foundingMember ? (
                            <span className="kw-badge kw-badge-primary">Founding Member</span>
                          ) : (
                            <span className="kw-badge kw-badge-neutral">Waitlist</span>
                          )}
                        </td>
                        <td>
                          {w.xuClaimed ? (
                            <span className="kw-badge kw-badge-success">Đã nhận +5 Xu</span>
                          ) : (
                            <span className="kw-badge kw-badge-warning">Chờ kích hoạt</span>
                          )}
                        </td>
                        <td>{formatFullDate(w.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
